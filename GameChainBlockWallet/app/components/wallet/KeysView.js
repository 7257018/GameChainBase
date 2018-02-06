/**
 * Created by necklace on 2017/3/13.
 */
import React from "react";
import BaseComponent from "../BaseComponent";
import ChainTypes from "../Utility/ChainTypes";
import Modal from "../layout/Modal";

//actions
import WalletUnlockActions from "../../actions/WalletUnlockActions";

//stores
import WalletDb from "../../stores/WalletDb";
import WalletUnlockStore from "../../stores/WalletUnlockStore";

class KeysView extends BaseComponent {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    constructor(props) {
        super(props);
        this.state = this.getInitState();
        this.onShow = this.onShow.bind(this);
    }

    getInitState() {
        return {
            visible: false,
            ownerPublicKey: "",
            ownerPrivateKey: "",
            activePublicKey: "",
            activePrivateKey: "",
            memoPublicKey: ""
        };
    }
    componentWillMount(){
        this.onNameClick();
    }
    componentDidMount(){
        WalletUnlockStore.listen(this.lockStatusChange.bind(this)); 
    }
    componentWillUnmount() {
        WalletUnlockStore.unlisten(this.lockStatusChange);
    }
    lockStatusChange(){
        if(WalletDb.isLocked()){
            this.setState(this.getInitState());
        }else{
            this.onShow();
        }
    }
    onNameClick(e) {
        // e.preventDefault();
        WalletUnlockActions.unlock().then(() => {
            this.onShow();
        })
    }

    onHide(e) {
        this.setState(this.getInitState());
    }

    onShow() {
        let {account}=this.props;
        let active = this.permissionsFromImmutable(account.get("active"));
        let owner = this.permissionsFromImmutable(account.get("owner"));
        let memo_key = account.get("options").get("memo_key");

        let newState = this.getInitState();
        newState.visible = true;
        newState.ownerPublicKey = (owner.keys && active.keys.size > 0) ? owner.keys.get(0) : '';
        newState.ownerPrivateKey = (newState.ownerPublicKey !== '') ? this.toWif(newState.ownerPublicKey) : '';
        newState.activePublicKey = (active.keys && active.keys.size > 0) ? active.keys.get(0) : '';
        newState.activePrivateKey = (newState.activePublicKey !== '') ? this.toWif(newState.activePublicKey) : '';
        newState.memoPublicKey = memo_key;
        this.setState(newState);
    }

    toWif(publicKey) {
        let privateKeyObj = WalletDb.getPrivateKey(publicKey);
        if (privateKeyObj && (privateKeyObj.toWif !== undefined && privateKeyObj.toWif !== null)) {
            return privateKeyObj.toWif();
        }
        return "";
    }

    permissionsFromImmutable(auths) {
        let threshold = auths.get("weight_threshold");
        let account_auths = auths.get("account_auths");
        let key_auths = auths.get("key_auths");
        let address_auths = auths.get("address_auths");

        let accounts = account_auths.map(a => a.get(0));
        let keys = key_auths.map(a => a.get(0));
        let addresses = address_auths.map(a => a.get(0));

        let weights = account_auths.reduce((res, a) => {
            res[a.get(0)] = a.get(1);
            return res;
        }, {});
        weights = key_auths.reduce((res, a) => {
            res[a.get(0)] = a.get(1);
            return res;
        }, weights);
        weights = address_auths.reduce((res, a) => {
            res[a.get(0)] = a.get(1);
            return res;
        }, weights);

        return {threshold, accounts, keys, addresses, weights};
    }

    render() {
        let {account}=this.props;
        let {
            visible, ownerPublicKey, ownerPrivateKey, activePublicKey, activePrivateKey, memoPublicKey
        } = this.state;

        return (
            <div className="LookKey">
            {/* <span>
                <label onClick={this.onNameClick.bind(this)}>{account.get('name')}</label>
                 <div className="popup-window">
                    <Modal visible={visible} onClose={this.onHide.bind(this)} customStyles={{height: 'auto',margin: '10px auto 10px auto'}}> */}
                        {/* <div className="title">{this.formatMessage('account_keysview')}</div> */}
                        <ul className="breadcrumb">
                            <li>
                                <a >钱包管理</a> 
                            </li>
                            <li className="active">
                                密钥查看
                            </li>
                        </ul>
                        <form>
                            {/* <div className="form-group">
                                <label >{this.formatMessage('account_owner_key')}</label>
                                <input type="text" className="form-control" value={ownerPublicKey} placeholder="********" />
                            </div>
                            <div className="form-group">
                                <label >{this.formatMessage('account_wif_key')}</label>
                                <input type="text" className="form-control" value={ownerPrivateKey} placeholder="********"  />
                            </div>
                            <br/> */}

                            {/* <div className="form-group">
                                <label >{this.formatMessage('account_active_key')}</label>
                                <input type="text" className="form-control" value={activePublicKey} placeholder="********"  />
                            </div> */}
                            <div className="form-group">
                                <label >privatekey</label>
                                <input type="text" className="form-control" value={activePrivateKey} placeholder="********"  />
                            </div>
                            {/* <br/>
                             <div className="form-group">
                                <label >{this.formatMessage('account_memo_key')}</label>
                                <input type="text" className="form-control" value={memoPublicKey}  placeholder="********" />
                            </div> */}
                        </form>
                        <footer>
                            {activePrivateKey?null:<button onClick={this.onNameClick.bind(this)} className="uk-button uk-button-primary uk-button-large">
                            解锁查看</button>}
                        </footer>
                       
                        {/* <div className="body scroll">
                            <div className="input-row">
                                <div className="label">{this.formatMessage('account_owner_key')}：</div>
                                <input className="input" type="text" value={ownerPublicKey}/>
                            </div>
                            <div className="input-row">
                                <div className="label">{this.formatMessage('account_wif_key')}：</div>
                                <input className="input" type="text" value={ownerPrivateKey}/>
                            </div>
                            <br/>
                            <div className="input-row">
                                <div className="label">{this.formatMessage('account_active_key')}：</div>
                                <input className="input" type="text" value={activePublicKey}/>
                            </div>
                            <div className="input-row">
                                <div className="label">{this.formatMessage('account_wif_key')}：</div>
                                <input className="input" type="text" value={activePrivateKey}/>
                            </div>
                            <br/>
                            <div className="input-row">
                                <div className="label">{this.formatMessage('account_memo_key')}：</div>
                                <input className="input" type="text" value={memoPublicKey}/>
                            </div>
                        </div> */}

                    {/* </Modal>
                </div>
            </span> */}
            </div>
        );
    }
}

export default KeysView;
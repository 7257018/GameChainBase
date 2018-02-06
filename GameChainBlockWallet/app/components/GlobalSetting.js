/**
 * Created by necklace on 2017/1/12.
 */
import React from "react";
import BaseComponent from "./BaseComponent";

//actions
import SettingsActions from "../actions/SettingsActions";
import IntlActions from "../actions/IntlActions";
import NotificationActions from "../actions/NotificationActions";
import WalletActions from "../actions/WalletActions";
import WalletUnlockActions from "../actions/WalletUnlockActions";
import AccountActions from "../actions/AccountActions";

import XNSelect from "./form/XNSelect";
import XNSwitch from "./form/XNSwitch";
import XNFullButton from "./form/XNFullButton";
import XNFullText from "./form/XNFullText";

//stores
import WalletManagerStore from "../stores/WalletManagerStore";
import AccountStore from "../stores/AccountStore";

import { Select,InputNumber,Button,Modal } from 'antd';
const Option = Select.Option;
const confirm = Modal.confirm;

import {update_ls_sha1s} from '../common';

class GlobalSetting extends BaseComponent {
    constructor(props) {
        super(props);
        this.state = {
            isRefresh:false
        };

        this.state.sel_current_wallet=WalletManagerStore.getState().current_wallet;

    }

    //修改语言
    onLanguageChange(d) {
        //console.debug(d);
        IntlActions.switchLocale(d.value);
        SettingsActions.changeSetting({setting: "locale", value: d.value});
    }

    //修改wsapi服务器地址
    onAPIChange(d) {
        SettingsActions.changeSetting({setting: "apiServer", value: d.value});
        setTimeout(() => {
            window.location = window.location.href.split('#')[0];
        }, 250);
    }

    /**
     * 修改水龙头服务器地址
     * @param d
     */
    onFaucetChange(v) {
        
        SettingsActions.changeSetting({setting: "faucet_address", value:v});
        setTimeout(() => {
            window.location = window.location.href.split('#')[0];
        }, 250);
    }

    onUnitChange(value) {
        SettingsActions.changeSetting({setting: "unit", value: value});
    }

    onLockTimeChange(d) {
        let newValue = parseInt(d, 10);
        if (newValue && !isNaN(newValue) && typeof newValue === "number") {
            SettingsActions.changeSetting({setting: "walletLockTimeout", value: d});
        }
    }

    onSwitchIMChange(d) {
        SettingsActions.changeSetting({setting: "disableChat", value: d});
    }

    onShowWalletManageClick(e) {
        e.preventDefault();
        this.context.router.push("/settings/wallet-manage");
    }

    onSetDefaultClick(e) {
        SettingsActions.clearSettings();
    }

    /**
     * 添加api服务器地址
     * @param item
     */
    onAddAPI(wsUrl) {
        if (wsUrl && (wsUrl.startsWith("ws://") || wsUrl.startsWith("wss://"))) {
            SettingsActions.addWS(wsUrl);
        } else {
            NotificationActions.addNotification({
                message: "websoket地址不正确",
                level: "error"
            });
        }
    }

    /**
     * 删除api服务器地址
     * @param item
     */
    onDelAPI(item, index) {
        SettingsActions.removeWS(index);
        if (item.value === this.props.settings.get('apiServer')) {
            let api = this.props.defaults.apiServer[0];
            this.onAPIChange.defer(api);
        }
    }

    onBackupClick(e) {
        e.preventDefault();
        this.context.router.push("/settings/backup");
    }

    onImportBackupClick(e) {
        e.preventDefault();
        this.context.router.push("/settings/import-backup");
    }

    onImportKeyClick(e) {
        e.preventDefault();
        this.context.router.push("/settings/import-key");
    }

    onWalletChange(item) {
        this.setState({sel_current_wallet:item.value});
    }

    changeCurrentWallet(){
        WalletActions.setWallet(this.state.sel_current_wallet).then((a)=>{
            NotificationActions.success("已切换到钱包" + this.state.sel_current_wallet);
            let linkedAccounts =AccountStore.getState().linkedAccounts.toArray().sort();
            if(linkedAccounts.length){
                AccountActions.setCurrentAccount.defer(linkedAccounts[0]);    
            }

            this.setState({isRefresh:!this.state.isRefresh})
        });  
    }

    onDeleteWallet(item){
        let current_wallet = WalletManagerStore.getState().current_wallet;

        item={value:this.state.sel_current_wallet};

        let title = this.formatMessage('message_title');
        let msg = this.formatMessage('wallet_confirmDelete');
        let names= WalletManagerStore.getState().wallet_names;

        WalletUnlockActions.unlock().then(() => {
           confirm({
                title:'确认退出当前钱包吗? 请确认已备份钱包或私钥',
                onOk:()=>{
                    AccountActions.setGlobalLoading.defer(true);   

                    update_ls_sha1s(item.value);

                    WalletManagerStore.onDeleteWallet(item.value).then(()=>{
                        AccountActions.setCurrentAccount.defer(null); 
                        if (names.size > 1) {
                            let wn = null;
                            names.forEach(name => {
                                if (name !== item.value) {
                                    wn = name;
                                }
                            });
                            if (wn) WalletActions.setWallet(wn);
                        }

                        setTimeout(() => {
                            window.location.reload();
                        }, 1000); 
                    }); 
                }
              });
        });
    }
    render() {
        //console.debug(this.props.defaults.apiServer);
        let locales = [];
        this.props.defaults.locale.map((item) => {
            locales.push({value: item, text: this.formatMessage('languages_' + item)});
        });

        let saveApi = this.props.settings.get('apiServer');

        let api = this.props.defaults.apiServer.find((a) => {
            if (a.value === saveApi) return a;
        });

        let faucet_address = this.props.settings.get('faucet_address');
        let faucets = this.props.defaults.apiFaucets;//[{value: faucet_address, text: faucet_address}];

        let units = [];
        let unit = this.props.settings.get('unit');
        this.props.defaults.unit.map((item, i) => {
            units.push({value: item, text: item});
        });

        let walletLockTimeout = this.props.settings.get("walletLockTimeout");

        let disableChat = this.props.settings.get("disableChat");

        let isInitError = (this.context.router.location.pathname == "/init-error");

        let wallets = [];
        let names= WalletManagerStore.getState().wallet_names;        
        names.forEach(name => {
            wallets.push({text: name, value: name});
        });
        let current_wallet = WalletManagerStore.getState().current_wallet;
        let sel_current_wallet=this.state.sel_current_wallet;
        return (
            <div className="vertical-flex scroll setting_home">
                <ul className="breadcrumb" style={{marginBottom:"0"}}>
                    <li>
                        <a >设置</a> 
                    </li>
                </ul>
                {/* <XNSelect label={this.formatMessage('settings_labLanguage')}
                          onChange={this.onLanguageChange.bind(this)}
                          data={locales}
                          value={this.formatMessage('languages_' + this.props.settings.get('locale'))}/>
                <div className="separate"></div>
                this.formatMessage('settings_labAPI') */}
             <div className="common_setting">
                {current_wallet?<XNSelect isDelete={false} data={wallets} label={this.formatMessage('settings_currentWallet')}
                        value={sel_current_wallet}
                        onChange={this.onWalletChange.bind(this)}
                        onDeleteItem={this.onDeleteWallet.bind(this)}
                />:null}

                {current_wallet?<div className="div_wallet_btn">
                    <Button type="primary"onClick={this.onDeleteWallet.bind(this)} icon="delete" size="large" ghost>删除当前钱包</Button>   

                    {sel_current_wallet!=current_wallet?<Button icon="retweet"  size="large"
                     onClick={this.changeCurrentWallet.bind(this)} type="primary"  ghost  >
                            切换到当前钱包
                    </Button>:null}
                </div>:null}

                <XNSelect label="接入点"
                          onChange={this.onAPIChange.bind(this)} isDelete={false} isAdd={false}
                          data={this.props.defaults.apiServer}
                          onAddItem={this.onAddAPI.bind(this)}
                          onDeleteItem={this.onDelAPI.bind(this)}
                          value={api.text}/>
                {/* <XNSelect label={this.formatMessage('settings_labFaucet')}
                          onChange={this.onFaucetChange.bind(this)} value={faucet_address}
                          data={faucets}/> */}
                <div className="div_label" >
                    注册入口
                </div>
                <div className="select-input"> 
                  <Select defaultValue={faucet_address} size="large"  onChange={this.onFaucetChange.bind(this)}>
                        { faucets.map(item=>{
                                return (<Option value={item.value}>{item.text}</Option>)
                         }) 
                        }
                    </Select>   
                 </div>
                {isInitError ? null : (<div>

                    <div className="div_label" >
                      {this.formatMessage('settings_labShowUnit')}
                    </div>
                    <div className="select-input"> 
                        <Select defaultValue={unit} size="large"  onChange={this.onUnitChange.bind(this)}>
                            { units.map(item=>{
                                    return (<Option value={item.value}>{item.text}</Option>)
                              }) 
                            }
                        </Select>   
                    </div>
                   
                    {/* {current_wallet?(<div>
                            <div className="div_label" >
                                {this.formatMessage('settings_labLockTime')}        
                            </div>
                            <div className="div-select-input" > 
                                <InputNumber size="large" defaultValue={walletLockTimeout} onChange={this.onLockTimeChange.bind(this)} />   
                             </div>
                        </div>):null}        */}
       

                    {/* { AccountStore.getState().currentAccount?  <Button type="primary"    onClick={this.onBackupClick.bind(this)} icon="export" size="large" ghost>{this.formatMessage('wallet_backup')}</Button>:null}             
                       

                    <Button type="primary"  onClick={this.onImportBackupClick.bind(this)} icon="switcher" size="large" ghost>{this.formatMessage('wallet_importBackup')}</Button>     

                    <Button type="primary" onClick={this.onImportKeyClick.bind(this)} icon="login" size="large" ghost>{this.formatMessage('wallet_importKey')}</Button> */}

                    <Button type="primary"    onClick={this.onSetDefaultClick.bind(this)} icon="setting" size="large" ghost>{this.formatMessage('settings_labDefaultSetting')}</Button>    
                </div>)}
              </div>
            </div>
        );
    }
}

export default GlobalSetting;

/*
 <XNSwitch label={this.formatMessage('settings_labDisableChat')}
 onChange={this.onSwitchIMChange.bind(this)} value={disableChat}/>
 */
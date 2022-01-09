import Vue from 'vue'

import {ethers} from 'ethers'
import WalletConnectProvider from "@walletconnect/web3-provider"

let EthersPlugin = {};

EthersPlugin.install = function (Vue, options) {
    let provider = null;
    let signer = null;
    let blockchain = {};

    const POGAddress = "0xFCb0f2D2f83a32A847D8ABb183B724C214CD7dD8";
    const POGAbi = [
        "function balanceOf(address) public view returns (uint256)",
        "function transfer(address to, uint amount)",
    ];

    blockchain.ethers = ethers;
    blockchain.getProvider = function(){
        return provider;
    };
    blockchain.setProvider = function(prov){
        provider = new ethers.providers.Web3Provider(prov, "any");
        signer = provider.getSigner();
        return true;
    };
    blockchain.setWalletConnectProvider = async function(){
        let provWC;
        try {
            provWC = new WalletConnectProvider({
                rpc: {56: "https://bsc-dataseed.binance.org"}// Required
            });
            await provWC.enable();
        } catch (e) {
            console.error(e);
            return false;
        }
        provider = new ethers.providers.Web3Provider(provWC, "any");
        signer = provider.getSigner();
        return true;
    };
    blockchain.getSigner = function(){
        if( signer == null )
            signer = provider.getSigner();
        return signer;
    };

    /**
     * @return {boolean}
     */
    blockchain.POGTransfer = async function(accountTo, amountTo) {
        console.log('Send '+ amountTo +' POG to: ', accountTo);
        const POGContract = new ethers.Contract(POGAddress, POGAbi, provider);
        const POGContractSigner = POGContract.connect(signer);
        let amountInt = ethers.utils.parseEther(amountTo.toString());
        try {
            const tx = await POGContractSigner.transfer(accountTo, amountInt);
            const receipt = await tx.wait();
            console.log(receipt);
            if(receipt.status === 1) {
                return true;
            }
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    /**
     * @return {string}
     */
    blockchain.POGBalance = async function(account) {
        console.log('Get Balance for: ', account);
        const POGContract = new ethers.Contract(POGAddress, POGAbi, provider);
        let bBal = await POGContract.balanceOf(account);
        return ethers.utils.formatEther(bBal);
    };
    blockchain.toHash = function(texto){
        if((/(0x)/).test(texto))
            return ethers.utils.keccak256(texto);
        else
            return ethers.utils.id(texto)
    };

    Vue.prototype.$Web3 = blockchain;
};

Vue.use(EthersPlugin);

import Vue from 'vue'

import {ethers} from 'ethers'
import WalletConnectProvider from "@walletconnect/web3-provider"

let EthersPlugin = {};

EthersPlugin.install = function (Vue, options) {
    let provider = null;
    let signer = null;
    let blockchain = {};

    const StakeAddress = "0x5B2005f92C65aBf8969806908EBA8d46B5808A52";
    const StakeAbi = [
        "function stake(uint _item, uint _amount, address _openTo) public",
        "function claim(uint[] _stakes, address _openTo) public",
        "function getStakeIds(address) public view returns (uint[])",
        "function getStakes(address) public view returns (tuple(uint192, uint32, uint32)[])",
    ];

    const POGAddress = "0xFCb0f2D2f83a32A847D8ABb183B724C214CD7dD8";
    const POGAbi = [
        "function balanceOf(address) public view returns (uint256)",
        "function allowance(address, address) public view returns (uint256)",
        "function approve(address spender, uint256 amount) public returns (bool)",
        "function transfer(address to, uint amount)",
    ];

    const NFTAddress = "0xC1c8F100c9Eff87c7C1e99a266b670FE4486dd17";
    const NFTAbi = [
        "function balanceOf(address, uint) public view returns (uint256)",
        "function balanceOfBatch(address[], uint[]) public view returns (uint256[])",
        "function isApprovedForAll(address, address) public view returns (bool)",
        "function setApprovalForAll(address, bool) public",
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
                rpc: {56: "https://bsc-dataseed.binance.org"}
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
     * @return Promise({boolean})
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
            return receipt.status === 1;
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

    /**
     * @return [NFTApprove, CoinApprove]
     */
    blockchain.NFTBalance = async function(account) {
        console.log('Get NFTs balance for: '+ account);
        const NFTContract = new ethers.Contract(NFTAddress, NFTAbi, provider);
        return await NFTContract.balanceOfBatch([account,account,account,account], [5,4,2,3]);
    };

    blockchain.CheckApprove = async function(account) {
        console.log('Check Approves for: '+ account);
        let approves = [false,false];
        const NFTContract = new ethers.Contract(NFTAddress, NFTAbi, provider);
        approves[0] = await NFTContract.isApprovedForAll(account, StakeAddress);
        const POGContract = new ethers.Contract(POGAddress, POGAbi, provider);
        let allowance = await POGContract.allowance(account, StakeAddress);
        if(allowance > 100000000)
            approves[1] = true;
        return approves;
    };

    blockchain.ApproveNFT = async function() {
        console.log('Set approve NFT');
        const NFTContract = new ethers.Contract(NFTAddress, NFTAbi, provider);
        const NFTContractSigner = NFTContract.connect(signer);
        try {
            const tx = await NFTContractSigner.setApprovalForAll(StakeAddress, true);
            const receipt = await tx.wait();
            console.log(receipt);
            return receipt.status === 1;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    blockchain.ApproveCoin = async function() {
        console.log('Set approve Coin');
        const POGContract = new ethers.Contract(POGAddress, POGAbi, provider);
        const POGContractSigner = POGContract.connect(signer);
        try {
            const tx = await POGContractSigner.approve(StakeAddress, ethers.constants.MaxUint256);
            const receipt = await tx.wait();
            console.log(receipt);
            return receipt.status === 1;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    blockchain.getStakes = async function(account) {
        console.log('Get my stakes');
        const StakesContract = new ethers.Contract(StakeAddress, StakeAbi, provider);
        const timeNow = Math.floor(+new Date()/1000);
        let staked = {
            '5': [],
            '4': [],
            '2': [],
            '3': []
        };
        let stakeIDs = await StakesContract.getStakeIds(account);
        if(stakeIDs.length > 0) {
            let stakesData = await StakesContract.getStakes(account);
            for (let i = 0; i < stakeIDs.length; i++) {
                const stake = stakesData[i];
                const lockTime = 1209600; // 14 days * 24 * 60 * 60
                const elapsed = stake[2] - timeNow;
                let extraItems = 0;
                if(elapsed > lockTime) {
                    extraItems = Math.floor(elapsed / lockTime) * stake[1];
                }

                if(Array.isArray(staked[stake[0]])) {
                    staked[stake[0]].push({
                        'stakeId': stakeIDs[i].toString(),
                        'amount': stake[1],
                        'unlockSeconds': elapsed,
                        'extraItems': extraItems
                    });
                }
            }
        }
        return staked;

    }

    blockchain.stakePOG = async function(itemID, amount) {
        console.log('Stake for '+ amount +' boxes: ', itemID);
        const POGContract = new ethers.Contract(StakeAddress, StakeAbi, provider);
        const POGContractSigner = POGContract.connect(signer);
        try {
            const tx = await POGContractSigner.stake(itemID, amount, ethers.constants.AddressZero);
            const receipt = await tx.wait();
            console.log(receipt);
            return receipt.status === 1;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    blockchain.claimPOG = async function(itemIDs) {
        console.log('Claim', itemIDs);
        const POGContract = new ethers.Contract(StakeAddress, StakeAbi, provider);
        const POGContractSigner = POGContract.connect(signer);
        try {
            const tx = await POGContractSigner.claim(itemIDs, ethers.constants.AddressZero);
            const receipt = await tx.wait();
            console.log(receipt);
            return receipt.status === 1;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    Vue.prototype.$Web3 = blockchain;
};

Vue.use(EthersPlugin);

<template>
      <div>
          <div>
              <div class="connectClass">
                  <div v-if="myWallet">My Wallet: {{ myWallet }}</div>
                  <div><button class="buttonConnect"
                               :class="{ active: MetamaskActive }"
                               @click="connectMatamask">Connect Metamask(Web3)</button></div>
                  <div><button class="buttonConnect walletConnect"
                               :class="{ active: WalletConnectActive }"
                               @click="WalletConnect"></button></div>
              </div>
          </div>
          <div>My POG balance: <b>{{ pogData.pogBalance }}</b></div>
          <div class="casesCards">
              <pog-stake-card case-name="Bronze"
                              :pog-balance="pogData.pogBalance"
                              :balance="pogData.bronzeNFT"
                              :approved-num="approvedNum"
                              :stakes="pogData.activeStakes['5']"></pog-stake-card>
              <pog-stake-card case-name="Silver"
                              :pog-balance="pogData.pogBalance"
                              :balance="pogData.silverNFT"
                              :approved-num="approvedNum"
                              :stakes="pogData.activeStakes['4']"></pog-stake-card>
              <pog-stake-card case-name="Gold"
                              :pog-balance="pogData.pogBalance"
                              :balance="pogData.goldNFT"
                              :approved-num="approvedNum"
                              :stakes="pogData.activeStakes['2']"></pog-stake-card>
              <pog-stake-card case-name="Platinum"
                              :pog-balance="pogData.pogBalance"
                              :balance="pogData.platinumNFT"
                              :approved-num="approvedNum"
                              :stakes="pogData.activeStakes['3']"></pog-stake-card>
          </div>
      </div>
</template>

<script>
export default {
    data() {
        return {
            myWallet: '',
            MetamaskActive: false,
            WalletConnectActive: false,
            pogData: {
                approvedNFT: false,
                approvedCoin: false,
                pogBalance:'0.0',
                bronzeNFT:'0',
                silverNFT:'0',
                goldNFT:'0',
                platinumNFT:'0',
                activeStakes: {}
            },
        };
    },
    computed: {
        approvedNum() {
            let counter = 0;
            if(this.pogData.approvedNFT)
                counter++;
            if(this.pogData.approvedCoin)
                counter++;
            return counter;
        }
    },
    methods: {
        getBalance() {
            console.log('Load POG balance');
            if(this.myWallet > '') {
                this.$Web3.POGBalance(this.myWallet).then(balance => {
                    this.pogData.pogBalance = balance;
                })
            } else {
                this.pogData.pogBalance = '0.00';
            }
        },
        getBoxes() {
            console.log('Load NFT balances');
            if(this.myWallet > '') {
                this.$Web3.NFTBalance(this.myWallet).then(balance => {
                    this.pogData.bronzeNFT = balance[0].toString();
                    this.pogData.silverNFT = balance[1].toString();
                    this.pogData.goldNFT = balance[2].toString();
                    this.pogData.platinumNFT = balance[3].toString();
                });
            }
        },
        getAllowance() {
            console.log('Check allowance');
            if(this.myWallet > '') {
                this.$Web3.CheckApprove(this.myWallet).then(allowance => {
                    this.pogData.approvedNFT = allowance[0];
                    this.pogData.approvedCoin = allowance[1];
                });
            }
        },
        async getStakes() {
            console.log('getStakes');
            if(this.myWallet > '') {
                this.$Web3.getStakes(this.myWallet).then(stakes => {
                    this.pogData.activeStakes = stakes;
                })
            }
        },
        async sendAllow() {
            console.log('sendAllow');
            if(!this.pogData.approvedNFT) {
                let status = await this.$Web3.ApproveNFT();
                if(status)
                    this.pogData.approvedNFT = true;
            }
            if(!this.pogData.approvedCoin) {
                let status = await this.$Web3.ApproveCoin();
                if(status)
                    this.pogData.approvedCoin = true;
            }
        },
        async stakePog(params) {
            const boxID = params[0];
            const boxCount = params[1];
            console.log('StakeBox');
            if(this.pogData.pogBalance < params[3]) {alert('You do not have enough POG balance. '+params[3]+' POG needed'); return;}
            if(this.approvedNum < 2) {alert('You do not have all approves needed'); return;}
            let status = await this.$Web3.stakePOG(boxID, boxCount);
            if(status) {
                alert('Stake successful.');
                await this.getBalance();
                await this.getBoxes();
                await this.getStakes();
            } else {
                alert('Error: Transaction not confirmed.');
            }
        },
        async claimPog(stakeIDs) {
            console.log('StakeBox');
            console.log(stakeIDs);
            let status = await this.$Web3.claimPOG(stakeIDs);
            if(status) {
                alert('Claimed successful.');
                await this.getBalance();
                await this.getBoxes();
                await this.getStakes();
            } else {
                alert('Error: Transaction not confirmed.');
            }
        },
        async connectMatamask() {
            if (window.ethereum) {
                this.$Web3.setProvider(window.ethereum);
                try {
                    let accounts = await this.$Web3.getProvider().send("eth_requestAccounts");
                    console.log(accounts);
                    this.myWallet = await this.$Web3.getSigner().getAddress();
                    this.MetamaskActive = true;
//                    this.myWallet = accounts[0];
                    return true;
                } catch (error) {
                    this.MetamaskActive = false;
                    console.log(error);
                    return false;
                }
            }
        },
        async WalletConnect() {
            let status = await this.$Web3.setWalletConnectProvider();
            if(status) {
                let provider = await this.$Web3.getProvider();
                this.myWallet = provider.provider.accounts[0];
                provider.provider.on("disconnect", (error, payload) => {
                    console.log("WalletConnect disconnected: ", payload);
                    this.WalletConnectActive = false;
                    this.myWallet = '';
                });
                this.WalletConnectActive = true;
            } else {
                this.WalletConnectActive = false;
                this.myWallet = '';
            }
        },
        async isMetamaskConnected() {
            if (window.ethereum) {
                this.$Web3.setProvider(window.ethereum);
                let network = await this.$Web3.getProvider().getNetwork();
                if(network.chainId === 56) {
                    try {
                        this.myWallet = await this.$Web3.getSigner().getAddress();
                        this.MetamaskActive = true;
//                         await this.$Web3.getProvider().send("eth_requestAccounts");
                        return true;
                    } catch (error) {
                        this.MetamaskActive = false;
                        console.log(error);
                        return false;
                    }
                } else {
                    alert('Wrong network. Switch to the Binance Smart Chain');
                }
            }
        }
    },
    watch: {
        myWallet(newWallet, oldWallet) {
            console.log('Watcher myWallet');
            console.log(newWallet);
            if(newWallet > '') {
                this.getBalance();
                this.getBoxes();
                this.getAllowance();
                this.getStakes();
            } else {
                this.pogData.pogBalance = '0.00';
            }
        }
    },
    created() {
        this.$nuxt.$on('send-allow-transaction', () => {
            this.sendAllow();
        });
        this.$nuxt.$on('stake-for-case', (params) => {
            this.stakePog(params);
        });
        this.$nuxt.$on('claim-stakes', (params) => {
            this.claimPog(params);
        });
    },
    beforeDestroy(){
        this.$nuxt.$off('send-allow-transaction');
        this.$nuxt.$off('stake-for-case');
        this.$nuxt.$off('claim-stakes');
    },
    async mounted() {
        if(await this.isMetamaskConnected()) {
            console.log('My Wallet ', this.myWallet);
            if (typeof window.ethereum !== "undefined") {
                window.ethereum.on('accountsChanged', (accounts) => {
                    this.myWallet = accounts[0];
                });
            }

        } else {
//            alert('Can not connect to Metamask wallet');
        }
    }
}
</script>

<style>
body {
    line-height: 150%;
}
.casesCards {
    display: flex;
}
.buttonConnect {
    padding: 8px;
    height: 40px;
}
.buttonConnect.walletConnect {
    background: #f0f0f0 url("~/assets/walletConnect.svg") no-repeat 0 -32px;
    background-size: 150px;
    width: 155px;
}
.buttonConnect.active {
    background-color: #cff0cf;
}
.connectClass {
    display: flex;
    justify-content: space-between;
}

</style>
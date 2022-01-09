<template>
    <div>
        <nav>
            <ul>
                <li><NuxtLink to="/">Wallet</NuxtLink></li>
                <li><NuxtLink to="/description">About Page</NuxtLink></li>
            </ul>
        </nav>
        <div>
            <div class="connectClass">
                <div v-if="myWallet">Your account: {{ myWallet }}</div>
                <div><button class="buttonConnect"
                             :class="{ active: MetamaskActive }"
                             @click="ConnectMetamask">Connect Metamask(Web3)</button></div>
                <div><button class="buttonConnect walletConnect"
                             :class="{ active: WalletConnectActive }"
                             @click="WalletConnect"></button></div>
            </div>
        </div>
        <main>
            <NuxtChild :my-wallet="myWallet"/>
        </main>
    </div>
</template>

<script>
    export default {
        name: "MainTemplate",
        data() {
            return {
                AccountsList: null,
                MetamaskActive: false,
                WalletConnectActive: false
            }
        },
        computed: {
            myWallet: function() {
                if(this.AccountsList)
                    return this.AccountsList[0];
                else
                    return ''
            }
        },
        methods:{
            async ConnectMetamask() {
                await this.isEthereumSupported()
            },
            async WalletConnect() {
                let status = await this.$Web3.setWalletConnectProvider();
                if(status) {
                    let provider = await this.$Web3.getProvider();
                    this.AccountsList = provider.provider.accounts;
                    provider.provider.on("disconnect", (error, payload) => {
                        console.log("WalletConnect disconnected: ", payload);
                        this.WalletConnectActive = false;
                        this.AccountsList = null;
                    });
                    this.WalletConnectActive = true;
                } else {
                    this.WalletConnectActive = false;
                    this.AccountsList = null;
                }
            },
            async isEthereumSupported() {
                // MetaMask
                if (window.ethereum) {
                    this.$Web3.setProvider(window.ethereum);
                } else if (window.web3) {
                    this.$Web3.setProvider(window.web3.currentProvider);
                } else if (await this.$Web3.setWalletConnectProvider()) {
                    this.AccountsList = await this.$Web3.getProvider().provider.accounts;
                    this.WalletConnectActive = true;
                }
                else {
                    //Wallet cont connected
                    return false;
                }
                if(window.ethereum) {
                    try {
                        this.AccountsList = await this.$Web3.getProvider().send("eth_requestAccounts");
                        this.MetamaskActive = true;
                        return true;
                    } catch (error) {
                        console.log(error);
                        return false;
                    }
                }
            }
        },
        async mounted() {
            if (typeof window.ethereum !== "undefined") {
                window.ethereum.on('accountsChanged', accounts => window.location.reload());
            }
            if (await this.isEthereumSupported()) {
                console.log('Wallet supported');
                //this.$nuxt.$emit('acconts-change', this.AccountsList);
            }
        }

    }
</script>

<style scoped>
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
    body {
        font-family: Arial, sans-serif;
        margin: 10px;
    }
    ul {
        list-style-type: none;
        padding: 0;
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
    }
    li {
        margin: 0 0.5rem;
        padding: 0.25rem;
        font-size: 1.2rem;
    }
    nav {
        padding: 0 1rem;
    }
    a {
        color: inherit;
        text-decoration: none;
    }
    nav a:hover {
        text-decoration: none;
    }
    a:hover {
        text-decoration: underline;
    }
    a.nuxt-link-exact-active {
        color: #00c58e;
    }
</style>

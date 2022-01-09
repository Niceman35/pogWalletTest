<template>
    <div>
        <h1>POG wallet</h1>
        <p>Address: {{ myWallet }}</p>
        <p>POG balance: {{ pogBalance }}</p>
        <button @click="loadBalance">Load balances</button><BR/><BR/>
        <div>Send: <input v-model.number="sendValue"> POG to <input v-model="sendAddress"> <input type="button" @click="sendPOG" value="Send"></div>
    </div>
</template>

<script>
    export default {
        name: "Wallet",
        props: {
            myWallet: String
        },
        data() {
            return {
                pogBalance:0,
                sendValue: 0,
                sendAddress: ''
            }
        },
        methods: {
            loadBalance: function() {
                console.log('Load Bals');
                this.$Web3.POGBalance(this.myWallet).then(balance => {
                    console.log(balance);
                    this.pogBalance = balance;
                })
            },
            sendPOG: function () {
                this.$Web3.POGTransfer(this.sendAddress, this.sendValue).then((status) => {
                    console.log("Status of transfer: "+status);
                    if(status === true) {
                        alert("Transaction complited");
                    }
                    if(status === false) {
                        alert("Transaction cancelled");
                    }
                    this.loadBalance();
                });
            }
        },
        watch: {
            myWallet(newWallet, oldWallet) {
                console.log('Watcher myWallet');
                console.log(newWallet);
                if(newWallet > '') {
                    this.loadBalance();
                } else {
                    this.pogBalance = 0;
                }
            }
        },
        mounted() {
            console.log('My Prop Wallet ', this.myWallet);
            if(this.myWallet > '')
                this.loadBalance();
        }
    }
</script>

<style>

</style>

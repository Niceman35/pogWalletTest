<template>
    <div>
        <h1>The Game</h1>
        <p>DeFi game with NFT items and in-game token. Free-to-play, cross-platform multiplayer game with NFT
            marketplace where supply and demand are controlled by users.</p>
        <p>Earn money on everything! Buy/sell items on NFT marketplace, improve your character and sell their  Skill Points!</p>
        <p>Open World is divided into three zones, where everyone will find something to do.</p>
    </div>
</template>
<script>
    export default {
        asyncData() {
            return { }
        },
        beforeMount() {

            this.$nuxt.$on('my-event', (dados) => {
                console.log("Hello!",dados)
            });
        },
        name: "Description"
    }
</script>
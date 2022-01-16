<template>
    <div class="CaseCard">
        <div>
            <div class="header">{{ caseName }} NFT Box</div>
            <div>Price: {{casePrice}} POG</div><br/>
            <div><b>Boxes in wallet: {{balance}}</b></div>
            <div><span v-for="num in parseInt(balance)" style="width: 30px; height: 30px;" :key="num">🎁</span> </div><br/>
            <div>Your current stakes:</div>
            <hr/>
            <div class="stakes-list">
            <div v-for="(stake, index) in myStakes" :key="index">
                <p>Boxes count: {{ stake.amount}}<br/>
                    Unlock {{ stake.unlock }}<br/>
                    Extra boxes (every 14 days): {{stake.extraItems}}
                </p>
                <button @click="$nuxt.$emit('claim-stakes', [stake.stakeId])" :disabled="stake.amountPOG===0">Claim: {{stake.amountPOG}} POG <span v-if="stake.extraItems>0">and {{stake.extraItems}} box{{getPlural(stake.extraItems)}}</span></button><br/>
                <hr/>
            </div>
            </div>
            <button v-if="unlockTokens[0] > 0" @click="$nuxt.$emit('claim-stakes', getClaimableIds())">Claim ALL: {{unlockTokens[0]}} POG <span v-if="unlockTokens[1]>0">and {{unlockTokens[1]}} case{{getPlural(unlockTokens[1])}}</span></button><br/>
        </div>
        <br/>
        <div class="with-button">
            <button @click="$nuxt.$emit('send-allow-transaction')" :class="{ 'approved': (approvedNum === 2) }">Approve {{ approvedNum }} / 2</button><br/><br/>
            <div>
                Boxes count: <input class="casesCount" v-model.number="casesToStake" type="number" step="1" min="1" size="3"><br/>
                <button @click="$nuxt.$emit('stake-for-case', [caseId, Math.floor(casesToStake), stakePrice])" :disabled="casesToStake<1 || approvedNum < 2 || stakePrice > parseFloat(pogBalance)">
                    Stake {{stakePrice}} POG for 14 days and <br/>get {{casesToStake}} {{caseName}} box{{getPlural(casesToStake)}}
                </button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "pogStakeCard",
    props:  ['caseName', 'pogBalance', 'balance', 'approvedNum', 'stakes'],
    data() {
        return {
            casesToStake: 1
        };
    },
    methods: {
        getCost: function (amount) {
            return amount*this.casePrice;
        },
        getPlural: function(amount) {
            return (amount > 1)?'es':'';
        },
        getClaimableIds: function () {
            let stakeIDs = [];
            if(Array.isArray(this.myStakes)) {
                for(let i =0; i < this.stakes.length; i++) {
                    const stake = this.stakes[i];
                    if(stake.amountPOG > 0) {
                        stakeIDs.push(stake.stakeId)
                    }
                }
            }
            return stakeIDs;
        }
    },
    computed: {
        casePrice() {
            const costs = {
                'Bronze': 250,
                'Silver': 500,
                'Gold': 1000,
                'Platinum': 1500,
            };
            return costs[this.caseName];
        },
        caseId() {
            const ids = {
                'Bronze': '5',
                'Silver': '4',
                'Gold': '2',
                'Platinum': '3'
            };
            return ids[this.caseName];
        },
        myStakes() {
            const units = {
                year  : 24 * 60 * 60 * 365,
                month : 24 * 60 * 60 * 365/12,
                day   : 24 * 60 * 60,
                hour  : 60 * 60,
                minute: 60,
                second: 1
            }
            const timeNow = Math.floor(+new Date()/1000);
            const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

            let stakes = this.stakes;
            if(Array.isArray(stakes)) {
                for(let i=0; i < stakes.length; i++) {
                    stakes[i].amountPOG = 0;
                    const stake = stakes[i];
                    let timeRel = '';
                    for (var u in units)
                        if (Math.abs(stake.unlockSeconds) > units[u] || u === 'second') {
                            timeRel = rtf.format(Math.round(stake.unlockSeconds / units[u]), u);
                            break;
                        }
                    stakes[i].unlock = timeRel;
                    if(stake.unlockSeconds <= 0) {
                        stakes[i].amountPOG = this.getCost(stake.amount);
                    }
                }
            }
            return stakes;
        },
        stakePrice() {
            return this.casesToStake >= 1? this.getCost(Math.floor(this.casesToStake)): 0;
        },
        unlockTokens() {
            // returns array [POG, ExtraCases]
            let unlock = [0,0];
            if(Array.isArray(this.myStakes)) {
                for(let i =0; i < this.stakes.length; i++) {
                    const stake = this.stakes[i];
                    unlock[0] += stake.amountPOG;
                    unlock[1] += stake.extraItems;
                }
            }
            return unlock;
        }
    }
}
</script>

<style scoped>
.CaseCard {
    margin: 10px;
    padding: 10px;
    min-width: 210px;
    max-width: 250px;
    border: solid 1px gray;
    line-height: 150%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.CaseCard button {
    padding:7px;
}

.CaseCard .with-button {
    text-align: center;
}
.stakes-list {
    max-height: 310px;
    overflow: auto;
}
.casesCount {
    width: 50px;
}
.CaseCard .approved {
    background-color: palegreen;
}
</style>
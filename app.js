const axios = require('axios');
const express = require('express');
const app = express();
require('dotenv').config();
const client = require('prom-client');
const Web3 = require('web3');
// URLs
const ethScanApiUrl = process.env.ETH_SCAN_BASE_URL
const ethFullNodeUrl = process.env.ETH_FULLNODE_BASE_URL
// metrics
const ethScanUpGauge = new client.Gauge({ name: 'eth_scan_up', help: 'if ethscan is accessible', labelNames: ['coin'] });
const ethScanCurrentBlockGauge = new client.Gauge({ name: 'eth_scan_current_block', help: 'number of current block', labelNames: ['coin'] });
const ethScanLastUpdateGauge = new client.Gauge({ name: 'eth_scan_last_update_seconds', help: 'number of latet block', labelNames: ['coin'] });
const fullnodeUpGauge = new client.Gauge({ name: 'eth_fullnode_up', help: 'if fullNode is accessible', labelNames: ['coin'] });
const fullnodeCurrentBlockGauge = new client.Gauge({ name: 'eth_fullnode_current_block', help: 'number of current block', labelNames: ['coin'] });
const fullnodeLastUpdateGauge = new client.Gauge({ name: 'eth_fullnode_last_update_seconds', help: 'number of latest block', labelNames: ['coin'] });
// get the latest ethScan block number
async function updateEthScanMetrics(){
    try{
        const ethScanLatestBlock = await axios.get(ethScanApiUrl, {headers: {'user-agent':'phinix'}});
        const coinName = process.env.COIN_NAME;
        ethScanUpGauge.set({ coin: coinName } ,1);
        ethScanCurrentBlockGauge.set({ coin: coinName } ,ethScanLatestBlock.data.backend.blocks);
        ethScanLastUpdateGauge.set({ coin: coinName } ,Math.floor(Date.now() / 1000));
    }
    catch(err) {
        console.log(err);
        ethScanUpGauge.set({ coin: process.env.COIN_NAME} ,0);
    }
}

// get the latest ethFullnode block number
async function updateEthFullNodeMetrics(){
    try{
        var web3Provider = new Web3.providers.HttpProvider(ethFullNodeUrl);
        var web3 = new Web3(web3Provider);
        const ethFullNOdeLatestBlock = await web3.eth.getBlockNumber();
        const coinName = process.env.COIN_NAME;
        fullnodeUpGauge.set({ coin: coinName } ,1);
        fullnodeCurrentBlockGauge.set({ coin: coinName } ,ethFullNOdeLatestBlock);
        fullnodeLastUpdateGauge.set({ coin: coinName } ,Math.floor(Date.now() / 1000));
    }
    catch(err){
        console.log(err);
        fullnodeUpGauge.set({ coin: process.env.COIN_NAME } ,0);
    }
}




// metrics endpoint for prometheus
app.get('/metrics', async (req, res) => {
    metrics = await client.register.metrics();
    return res.status(200).send(metrics);
});

app.listen(process.env.LISTEN_PORT, () => console.log('Server is running and metrics are exposed on http://URL:3000/metrics'));

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(){
   while(true){
       await Promise.all([updateEthScanMetrics(), updateEthFullNodeMetrics(), delay(process.env.REFRESH_INTERVAL_MILLISECONDS)]);
   }
}

main();


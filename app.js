const axios = require('axios');
const express = require('express');
const app = express();
require('dotenv').config();
const client = require('prom-client');
const Web3 = require('web3');
axios.defaults.timeout = 4000;
// URLs
const globalBlockbookEndpoint = process.env.GLOBAL_BLOCKBOOK_ENDPOINT
const FullNodeUrl = process.env.FULLNODE_BASE_URL
// metrics
const GlobalBlockbookUpGauge = new client.Gauge({ name: 'global_blockbook_up', help: 'if global blockbook is accessible', labelNames: ['coin'] });
const GlobalBlockbookCurrentBlockGauge = new client.Gauge({ name: 'global_blockbook_current_block', help: 'number of current block', labelNames: ['coin'] });
const GlobalBlockbookLastUpdateGauge = new client.Gauge({ name: 'global_blockbook_last_update_seconds', help: 'last update from the global blockbook', labelNames: ['coin'] });
const fullnodeUpGauge = new client.Gauge({ name: 'fullnode_up', help: 'if fullNode is accessible', labelNames: ['coin'] });
const fullnodeCurrentBlockGauge = new client.Gauge({ name: 'fullnode_current_block', help: 'number of current block', labelNames: ['coin'] });
const fullnodeLastUpdateGauge = new client.Gauge({ name: 'fullnode_last_update_seconds', help: 'last update from the node', labelNames: ['coin'] });
// get the latest ethScan block number
async function updateGlobalBlockbookMetrics(){
    try{
        console.log('starting globalBlockbookLatestBlock');
        const globalBlockbookLatestBlock = await axios.get(globalBlockbookEndpoint, {headers: {'user-agent':'phinix'}});
        console.log('done globalBlockbookLatestBlock');
        console.log('///////////////////////////////');
        const coinName = process.env.COIN_NAME;
        GlobalBlockbookUpGauge.set({ coin: coinName } ,1);
        GlobalBlockbookCurrentBlockGauge.set({ coin: coinName } ,globalBlockbookLatestBlock.data.backend.blocks);
        GlobalBlockbookLastUpdateGauge.set({ coin: coinName } ,Math.floor(Date.now() / 1000));
    }
    catch(err) {
        console.log(err);
        console.log('error on globalBlockbookLatestBlock');
        GlobalBlockbookUpGauge.set({ coin: process.env.COIN_NAME} ,0);
    }
}

// get the latest ethFullnode block number
async function updateFullNodeMetrics(){
    try{
        console.log('starting FullNOdeLatestBlock');
        var web3Provider = new Web3.providers.HttpProvider(FullNodeUrl);
        var web3 = new Web3(web3Provider);
        const FullNOdeLatestBlock = await web3.eth.getBlockNumber();
        console.log('done FullNOdeLatestBlock');
        console.log('///////////////////////////////');
        const coinName = process.env.COIN_NAME;
        fullnodeUpGauge.set({ coin: coinName } ,1);
        fullnodeCurrentBlockGauge.set({ coin: coinName } ,FullNOdeLatestBlock);
        fullnodeLastUpdateGauge.set({ coin: coinName } ,Math.floor(Date.now() / 1000));
    }
    catch(err){
        console.log(err);
        console.log('error on FullNOdeLatestBlock');
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
       await Promise.all([updateGlobalBlockbookMetrics(), updateFullNodeMetrics(), delay(process.env.REFRESH_INTERVAL_MILLISECONDS)]);
   }
}

main();


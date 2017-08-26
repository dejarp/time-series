const _ = require('lodash');
const Rx = require('rxjs');
const request = require('request');
const BFX = require('bitfinex-api-node');
const bfxPriceSeries = require('./bfx-price-series');
const BollingerBandLower = require('./bollinger-band-lower');

const API_KEY_V2 = 'g0iI9DsJmEuLnZDIHJFXsm1DaJpqvA4TDQZlOslyYjA';
const API_SECRET_V2 = 'ONXjRxvFdy7XgPIO6HBn2gQx2sjLb3YGdLRc60etZPc';

const bfxFrom = 'BTC';
const bfxTo = 'USD';
const bfxSymbol = `t${bfxFrom}${bfxTo}`;

// the version passed in earlier controls the version of the WebSockets API
const bfxAPI = new BFX(API_KEY_V2, API_SECRET_V2, {
    version: 2,
    transform: true
});

bws = bfxAPI.ws;
brest = bfxAPI.rest;

function placeLimitOrder(bfxWS, symbol, amount, price) {
    var tot = new Date();
    var cid = tot.getTime();
    
    const order = [
        0,
        'on',
        null,
        {
            cid: cid,
            // EXCHANGE LIMIT is only different from LIMIT in which funds it is using
            type: 'EXCHANGE LIMIT',
            symbol: symbol,
            amount: amount.toString(),
            price: price.toString(),
            hidden: 0
        }
    ];
    
    bfxWS.submitOrder(order);
    return cid;
}

var activeOrders = {};
function cancelOrder(bfxWS, cid) {
    var orderId = _.get(activeOrders, cid)[0];

    // Note: the docs say that orders can be canceled using the cid and cid_date
    //       but I have found that to not be the case. It will always display the
    //       "order not found" message in bitfinex. I don't know if this happens
    //       due to misuse of the API or a bug on their end. Leaning towards latter.
    const orderCancel = [
        0,
        "oc",
        null,
        {
            "id": orderId
        }
    ];

    bfxWS.send(orderCancel);
}

bws.on('auth', () => {
    console.log('authenticated with bitfinex')
    // placeLimitOrder(bws, bfxSymbol, -1, .00025);

    // setup trading bot
    var oneSecond = 1000;
    var fiveSeconds = 5 * oneSecond;
    var oneMinute = 60 * oneSecond;
    var fifteenMinutes = 15 * oneMinute;
    var priceTimeSeries = bfxPriceSeries(bfxAPI, bfxSymbol, fifteenMinutes);
        
    var multiplier = 2;
    var periods = 20;
    var bollingerBandLowerSeries = BollingerBandLower(priceTimeSeries, periods, multiplier);
    
    bollingerBandLowerSeries.subscribe((point) => {
        console.log( `Date: ${point.d}, Value: ${point.v} ${bfxTo}`);
    });
});

bws.on('message', (msg) => {
    var channelId = msg[0];
    var messageType = msg[1];
    var payload = msg[2];
    if(messageType === 'on') {
        var cid = payload[3];
        activeOrders[cid] = payload;
    }
});

bws.on('open', () => {
    bws.auth();
    bws.subscribeTrades(bfxSymbol);
});

bws.on('error', console.error);

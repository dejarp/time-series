const _ = require('lodash');
const Rx = require('rxjs');
const BFX = require('bitfinex-api-node');

// const API_KEY_V1 = '1mqGnxdFsLySYW53W4bgEwU38HfbFBKcNOvesYqmNMW';
// const API_SECRET_V1 = '3fvJhDb2LU86dES4nho27c3zyd400mb0FSVdJCAxrKF';

const API_KEY_V2 = 'g0iI9DsJmEuLnZDIHJFXsm1DaJpqvA4TDQZlOslyYjA';
const API_SECRET_V2 = 'ONXjRxvFdy7XgPIO6HBn2gQx2sjLb3YGdLRc60etZPc';

const opts = {
  version: 2,
  transform: true
};

// the version passed in earlier controls the version of the WebSockets API
// const restV1 = new BFX(API_KEY_V1, API_SECRET_V1, { version: 1, transform: true }).rest;
const bws = new BFX(API_KEY_V2, API_SECRET_V2, opts).ws;

bws.on('open', () => {
    bws.subscribeOrderBook('IOTBTC')
});


var bookChannelId;
var orderbook = {
    bids: [],
    asks: []
};
var orderbookStream = new Rx.Subject();
bws.on('message', (msg) => {
    var channelId = msg[0];
    var messageType = msg[1];
    var payload = msg[2];
    // console.log('Message: ');
    // console.log(msg);
    if(_.isPlainObject(msg)) {
        if(msg.event === 'info') {

        } else if(msg.event === 'subscribed') {
            if(msg.channel === 'book') {
                bookChannelId = msg.chanId;
            }
        }
    } else if(_.isArray(msg)) {
        if(msg[0] === bookChannelId) {
            if(_.isArray(msg[1]) && _.isArray(msg[1][0])) {
                var orderbookInitialStates = msg[1];
                _.forEach(orderbookInitialStates, (obis) => {
                    var price = obis[0];
                    var count = obis[1];
                    var amount = obis[2];

                    if(amount > 0) {
                        var index = _.sortedIndexBy(orderbook.bids, {price: price}, bid => bid.price);
                        orderbook.bids.splice(index, 0, {
                            price: price,
                            count: count,
                            amount: amount
                        });
                    } else if(amount < 0) {
                        var index = _.sortedIndexBy(orderbook.asks, {price: price}, ask => ask.price);
                        orderbook.asks.splice(index, 0, {
                            price: price,
                            count: count,
                            amount: amount
                        });
                    } else {
                        throw new Error('well that was unexpected');
                    }
                });
            } else if (_.isArray(msg[1])) {
                var orderbookUpdate = msg[1];
                //console.log(orderbookUpdate);
                var price = orderbookUpdate[0];
                var count = orderbookUpdate[1];
                var amount = orderbookUpdate[2];

                if(count > 0) {
                    if(amount > 0) {
                        var index = _.sortedIndexBy(orderbook.bids, {price: price}, bid => bid.price);
                        if(!orderbook.bids[index] || orderbook.bids[index].price !== price) {
                            orderbook.bids.splice(index, 0, {
                                price: price,
                                count: count,
                                amount: amount
                            });
                        } else {
                            orderbook.bids[index].amount = amount;
                            orderbook.bids[index].count = count;
                        }
                    } else if(amount < 0) {
                        var index = _.sortedIndexBy(orderbook.asks, {price: price}, ask => ask.price);
                        if(!orderbook.asks[index] || orderbook.asks[index].price !== price) {
                            orderbook.asks.splice(index, 0, {
                                price: price,
                                count: count,
                                amount: amount
                            });
                        } else {
                            orderbook.asks[index].amount = amount;
                            orderbook.asks[index].count = count;
                        }
                    }
                } else {
                    if(amount === 1) {
                        var index = _.sortedIndexBy(orderbook.bids, {price: price}, bid => bid.price);
                        orderbook.bids.splice(index,1);
                    } else if(amount === -1) {
                        var index = _.sortedIndexBy(orderbook.asks, {price: price}, ask => ask.price);
                        orderbook.asks.splice(index,1);
                    }
                }
            }

            orderbookStream.next(_.cloneDeep(orderbook));
        }
    }
});

bws.on('error', console.error);

var groupedOrderbookStream = orderbookStream
    .map(orderbook => {
        return {
            bids: _(orderbook.bids)
                .groupBy(bid => bid.price.toFixed(7))
                .map(groupedBids => ({
                    price: parseFloat(groupedBids[0].price.toFixed(7)),
                    amount: _(groupedBids).map('amount').sum(),
                    count: _(groupedBids).map('count').sum()
                }))
                .value(),
            asks: _(orderbook.asks)
                .groupBy(ask => ask.price.toFixed(7))
                .map(groupedAsks => ({
                    price: parseFloat(groupedAsks[0].price.toFixed(7)),
                    amount: _(groupedAsks).map('amount').sum(),
                    count: _(groupedAsks).map('count').sum()
                }))
                .value()
        }
    });

var bidAskStream = groupedOrderbookStream
    .map(orderbook => ({
        bid: _.last(orderbook.bids),
        ask: _.first(orderbook.asks)
    }))
    .distinctUntilChanged(_.isEqual)

bidAskStream.subscribe((orderbookSnapshot) => {
    console.log(orderbookSnapshot);
});
const _ = require('lodash');
const Rx = require('rxjs');
const request = require('request');
const AlignToDates = require('./align-to-dates');
const BFX = require('bitfinex-api-node')

const API_KEY = 'g0iI9DsJmEuLnZDIHJFXsm1DaJpqvA4TDQZlOslyYjA'
const API_SECRET = 'ONXjRxvFdy7XgPIO6HBn2gQx2sjLb3YGdLRc60etZPc'

const url = 'https://api.bitfinex.com/v2';

var bfxTimeFrames = {
    '60000': '1m',
    '300000': '5m',
    '900000': '15m',
    '1800000': '30m',
    '3600000': '1h',
    '10800000': '3h',
    '21600000': '6h',
    '43200000': '12h',
    '86400000': '1D',
    '604800000': '7D',
    '1209600000': '14D'
    // 1M is also supported, but since the length is variable there can
    // be no direct translation.
}

module.exports = (bfxFrom, bfxTo, cycleLength) => {
    var bfxPairId = `${bfxFrom}${bfxTo}`;
    var bfxSymbol = `t${bfxPairId}`;

    const bfxAPI = new BFX(API_KEY, API_SECRET, {
        version: 2,
        transform: true
    });

    var twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - (24 * 7));
    var nearestCycleStartTime = Math.floor(twentyFourHoursAgo.getTime() / cycleLength) * cycleLength;
    twentyFourHoursAgo.setTime(nearestCycleStartTime);
    
    var now = new Date();
    var nextCycleTime = Math.ceil(now / cycleLength) * cycleLength;
    
    var futureCycles = Rx.Observable
        .timer(nextCycleTime, cycleLength)
        .map(cyclesSinceTimerStarted => new Date(nextCycleTime + (cycleLength * cyclesSinceTimerStarted)));
    
    var pastCycleCount = Math.floor((now - nearestCycleStartTime) / cycleLength);
    var pastCycles = Rx.Observable
        .range(1, pastCycleCount)
        .map(cycleNumber => new Date(cycleNumber * cycleLength + nearestCycleStartTime));
    
    var cycles = pastCycles.concat(futureCycles);
    
    var priceOpenSubject= new Rx.Subject();
    var priceCloseSubject = new Rx.Subject();
    var priceHighSubject = new Rx.Subject();
    var priceLowSubject= new Rx.Subject();
    var volumeSubject = new Rx.Subject();
    
    request.get( 
        `${url}/candles/trade:${bfxTimeFrames[cycleLength]}:${bfxSymbol}/hist`,
        (error, response, body) =>  {
            var candles = JSON.parse(body);
    
            _.forEachRight(candles, (candle) => {
                // [date, open, close, high, low, volume]
                var date = new Date(candle[0]);
                priceOpenSubject.next({
                    d: date,
                    v: candle[1]
                });
                priceCloseSubject.next({
                    d: date,
                    v: candle[2]
                });
                priceHighSubject.next({
                    d: date,
                    v: candle[3]
                });
                priceLowSubject.next({
                    d: date,
                    v: candle[4]
                });
                volumeSubject.next({
                    d: date,
                    v: candle[5]
                });
            });
    
            priceOpenSubject.complete();
            priceHighSubject.complete();
            priceLowSubject.complete();
            volumeSubject.complete();
        }
    );
    
    bfxAPI.ws.on('open', () => {
        bfxAPI.ws.subscribeTrades(bfxPairId);
        bfxAPI.ws.subscribeOrderBook('IOTBTC')
    });

    bfxAPI.ws.on('trade', (pair, trades) => {
        // 'te' stands for trade execution
        if(_.first(trades) !== 'te') {
            return;
        }
        _(trades)
            .tail()
            .forEachRight((trade) => {
                var date = new Date(trade.MTS);
                var price = trade.PRICE;
                var streamPoint = {
                    d: date,
                    v: price
                };
                priceCloseSubject.next(streamPoint);
            });
    });

    var bookChannelId;
    var orderbook = {
        bids: [],
        asks: []
    };

    var orderbookDataSource = new Rx.Subject();
    bfxAPI.ws.on('message', (msg) => {
        var messageTimeStamp = new Date();
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
    
                orderbookDataSource.next({
                    d: messageTimeStamp,
                    v: _.cloneDeep(orderbook)}
                );
            }
        }
    });

    var groupedOrderbookDataSource = orderbookDataSource
        .map(orderbook => {
            return {
                d: orderbook.d,
                v: {
                    bids: _(orderbook.v.bids)
                        .groupBy(bid => bid.price.toFixed(7))
                        .map(groupedBids => ({
                            price: parseFloat(groupedBids[0].price.toFixed(7)),
                            amount: _(groupedBids).map('amount').sum(),
                            count: _(groupedBids).map('count').sum()
                        }))
                        .value(),
                    asks: _(orderbook.v.asks)
                        .groupBy(ask => ask.price.toFixed(7))
                        .map(groupedAsks => ({
                            price: parseFloat(groupedAsks[0].price.toFixed(7)),
                            amount: _(groupedAsks).map('amount').sum(),
                            count: _(groupedAsks).map('count').sum()
                        }))
                        .value()
                }
            }
        });

    var bidAskDataSource = groupedOrderbookDataSource
        .map(orderbook => ({
            d: orderbook.d,
            v: {
                bid: _.last(orderbook.v.bids),
                ask: _.first(orderbook.v.asks)
            }
        }))
        .distinctUntilChanged(_.isEqual)

    var bidsDataSource = bidAskDataSource
        .map(bidAsk => ({
            d: bidAsk.d,
            v: bidAsk.v.bid.price
        }));

    var asksDataSource = bidAskDataSource
        .map(bidAsk => ({
            d: bidAsk.d,
            v: bidAsk.v.ask.price
        }));

    bfxAPI.ws.on('error', console.error)

    var priceOpenDataSource = priceOpenSubject;
    var priceCloseDataSource = priceCloseSubject;
    var priceHighDataSource = priceHighSubject
        .concat(priceCloseSubject)
        .scan((accumulator, point) => {
            if(accumulator.currentDate === null || accumulator.currentDate.getTime() !== point.d.getTime()) {
                accumulator.currentDate = point.d;
                accumulator.currentHigh = point.v;
            } else {
                if(accumulator.currentHigh < point.v) {
                    accumulator.currentHigh = point.v;
                } else {
                    // do nothing
                }
            }
            return accumulator;
        }, {
            currentDate: null,
            currentHigh: Number.NEGATIVE_INFINITY
        })
        .map(accumulator => ({
            d: accumulator.currentDate,
            v: accumulator.currentHigh
        }))
        .distinctUntilChanged();
    var priceLowDataSource = priceLowSubject
        .concat(priceCloseSubject)
        .scan((accumulator, point) => {
            if(accumulator.currentDate === null || accumulator.currentDate.getTime() !== point.d.getTime()) {
                accumulator.currentDate = point.d;
                accumulator.currentLow = point.v;
            } else {
                if(accumulator.currentLow > point.v) {
                    accumulator.currentLow = point.v;
                } else {
                    // do nothing
                }
            }
            return accumulator;
        }, {
            currentDate: null,
            currentLow: Number.POSITIVE_INFINITY
        })
        .map(accumulator => ({
            d: accumulator.currentDate,
            v: accumulator.currentLow
        }))
        .distinctUntilChanged();
    
    function BfxDataToTimeSeries(dataSource) {
        return dataSource.map(streamPoint => ({
            d: new Date(Math.floor(streamPoint.d.getTime() / cycleLength) * cycleLength),
            v: streamPoint.v
        }));
    }

    var priceOpenTimeSeries = AlignToDates(BfxDataToTimeSeries(priceOpenDataSource), cycles);
    var priceCloseTimeSeries = AlignToDates(BfxDataToTimeSeries(priceCloseDataSource), cycles);
    var priceHighTimeSeries = AlignToDates(BfxDataToTimeSeries(priceHighDataSource), cycles);
    var priceLowTimeSeries = AlignToDates(BfxDataToTimeSeries(priceLowDataSource), cycles);
    var bidsTimeSeries = AlignToDates(BfxDataToTimeSeries(bidsDataSource), cycles).distinctUntilChanged(_.isEqual);
    var asksTimeSeries = AlignToDates(BfxDataToTimeSeries(asksDataSource), cycles).distinctUntilChanged(_.isEqual);
    
    return {
        opens: priceOpenTimeSeries,
        closes: priceCloseTimeSeries,
        highs: priceHighTimeSeries,
        lows: priceLowTimeSeries,
        bids: bidsTimeSeries,
        asks: asksTimeSeries
    };
}
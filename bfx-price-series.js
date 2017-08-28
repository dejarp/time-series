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
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
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
    
    return {
        opens: priceOpenTimeSeries,
        closes: priceCloseTimeSeries,
        highs: priceHighTimeSeries,
        lows: priceLowTimeSeries
    };
}
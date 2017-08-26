const _ = require('lodash');
const Rx = require('rxjs');
const request = require('request');
const AlignToDates = require('./align-to-dates');

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

module.exports = (bfxAPI, bfxSymbol, cycleLength) => {

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
    
    var priceTimeSeries = new Rx.Subject();
    request.get( 
        `${url}/candles/trade:${bfxTimeFrames[cycleLength]}:${bfxSymbol}/hist`,
        (error, response, body) =>  {
            var candles = JSON.parse(body);
    
            _.forEachRight(candles, (candle) => {
                // [date, open, close, high, low, volume]
                var date = new Date(candle[0]);
                var price = candle[2];
                var streamPoint = {
                    d: date,
                    v: price
                };
                priceTimeSeries.next(streamPoint);
            });
        }
    );
    
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
                priceTimeSeries.next(streamPoint);
            });
    });

    return AlignToDates(
        priceTimeSeries
            //.do(console.log)
            .map(streamPoint => ({
                d: new Date(Math.floor(streamPoint.d.getTime() / cycleLength) * cycleLength),
                v: streamPoint.v
            })),
        cycles
    );
}
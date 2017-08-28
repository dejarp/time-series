var _ = require('lodash');
var Rx = require('rxjs');
var request = require('request');
var url = 'https://api.bitfinex.com/v2';

const BFX = require('bitfinex-api-node')

const API_KEY = 'g0iI9DsJmEuLnZDIHJFXsm1DaJpqvA4TDQZlOslyYjA'
const API_SECRET = 'ONXjRxvFdy7XgPIO6HBn2gQx2sjLb3YGdLRc60etZPc'

const opts = {
  version: 2,
  transform: true
}

const bws = new BFX(API_KEY, API_SECRET, opts).ws;

var bfxFrom = 'BTC';
var bfxTo = 'USD';

var bfxPairId = bfxFrom + bfxTo;

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

var oneSecond = 1000;
var fiveSeconds = 5 * oneSecond;
var oneMinute = 60 * oneSecond;
var fiveMinutes = 5 * oneMinute;
var fifteenMinutes = 15 * oneMinute;


var twentyFourHoursAgo = new Date();
twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
var cycleLength = fiveMinutes;
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
    `${url}/candles/trade:${bfxTimeFrames[cycleLength]}:t${bfxPairId}/hist`,
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

bws.on('auth', () => {
    // emitted after .auth()
    // needed for private api endpoints

    console.log('authenticated')
    // bws.submitOrder ...
    })

    bws.on('open', () => {
    //bws.subscribeTicker(bfxPairId)
    //bws.subscribeOrderBook(bfxPairId)
    bws.subscribeTrades(bfxPairId)

    // authenticate
    // bws.auth()
});

bws.on('trade', (pair, trades) => {
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
            priceCloseDataSource.next(streamPoint);
        });
});

bws.on('error', console.error)

function BfxDataToTimeSeries(dataSource) {
    return dataSource.map(streamPoint => ({
        d: new Date(Math.floor(streamPoint.d.getTime() / cycleLength) * cycleLength),
        v: streamPoint.v
    }));
}

const AlignToDates = require('./align-to-dates');

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

var priceOpenTimeSeries = AlignToDates(BfxDataToTimeSeries(priceOpenDataSource), cycles);
var priceCloseTimeSeries = AlignToDates(BfxDataToTimeSeries(priceCloseDataSource), cycles);
var priceHighTimeSeries = AlignToDates(BfxDataToTimeSeries(priceHighDataSource), cycles);
var priceLowTimeSeries = AlignToDates(BfxDataToTimeSeries(priceLowDataSource), cycles);

function MovingWindow(timeSeries, periods) {
    return timeSeries
        .scan((window, point) => {
            if(_.isEmpty(window)) {
                window.push(point);
            } else {
                if(window[window.length-1].d.getTime() === point.d.getTime()) {
                    window[window.length-1] = point;
                } else {
                    return _(window).takeRight(periods - 1).push(point).value();
                }
            }
            return window;
        }, [])
        .filter(window => window.length === periods)
        //.do(window => console.log(window));
}

function Lag(timeSeries, periods) {
    return MovingWindow(timeSeries, periods + 1)
        .map(window => ({
            d: window[window.length-1].d,
            v: window[0].v
        }))
}

function mean(points) {
    return _(points).map('v').sum() / points.length;
}

function stddev(points) {
    var m = mean(points);
    var variance = _(points).map('v').map(value => Math.pow(value - m, 2)).sum() / points.length;
    var standardDeviation = Math.sqrt(variance);
    return standardDeviation;
}

function SimpleMovingAverage(timeSeries, periods) {
    return MovingWindow(timeSeries, periods)
        .map(points => ({
            d: _.last(points).d,
            v: mean(points)
        }))
        //.do(point => console.log(`SMA: Date: ${point.d}, Value: ${point.v}`))
        ;
}

function StandardDeviation(timeSeries, periods) {
    return MovingWindow(timeSeries, periods)
        .map(points => ({
            d: _.last(points).d,
            v: stddev(points)
        }))
        //.do(point => console.log(`PostSMA: Date: ${point.d}, Value: ${point.v}`))
        ;
}

function MultiplyBy(timeSeries, multiplier) {
    return timeSeries
        .map(point => ({
           d: point.d,
           v: point.v * multiplier
        }));
}

function Collate(multipleTimeSeries) {
    var wrappedTimeSeries = _(multipleTimeSeries)
        .mapValues((timeSeries, timeSeriesName) => {
            return timeSeries
                .map(point => ({
                    name: timeSeriesName,
                    point: point
                }));
        })
        .value();

    var timeSeriesNames = _.keys(wrappedTimeSeries);

    return _.spread(Rx.Observable.merge)(_.values(wrappedTimeSeries))
        .scan((accumulator, wrappedPoint) => {
            accumulator.frameToEmit = null;
            var index = _.sortedIndexBy(accumulator.bins, {date: wrappedPoint.point.d}, bin => bin.date);
            if(!accumulator.bins[index]) {
                if(accumulator.currentDate === null 
                    || accumulator.currentDate < wrappedPoint.point.d) {
                    accumulator.bins[index] = {
                        date: wrappedPoint.point.d,
                        frame: {}
                    };   
                } else {
                    // do nothing, the date on the new point is less than the current date
                }
            } else {
                // do nothing, no need to add bin which already exists
            }
            accumulator.bins[index].frame[wrappedPoint.name] = wrappedPoint.point;

            // if the bin just touch is full emit it
            var isBinFull = _.every(timeSeriesNames, (timeSeriesName) => _.has(accumulator.bins[index].frame, timeSeriesName));
            if(isBinFull) {
                accumulator.frameToEmit = accumulator.bins[index].frame;
                accumulator.currentDate = accumulator.bins[index].date;
                accumulator.bins.splice(0, index);
            }

            return accumulator;
        }, {
            frameToEmit: null,
            currentDate: null,
            bins: []
        })
        .map(accumulator => accumulator.frameToEmit)
        .filter(frame => frame !== null)
}

function Subtract(minuendTimeSeries, subtrahendTimeSeries) {
    return Collate({ 
        minuend: minuendTimeSeries, 
        subtrahend: subtrahendTimeSeries })
        .map(collection => ({
            d: collection.minuend.d,
            v: collection.minuend.v - collection.subtrahend.v
        }))
}

var multiplier = 2;
var periods = 20;

const BollingerBandLower = require('./bollinger-band-lower');

var bollingerBandLowerSeries = BollingerBandLower(priceCloseTimeSeries, periods, multiplier);

const StochasticD = require('./stochastic-d');
var stochasticDStream = StochasticD(
    priceCloseTimeSeries, priceHighTimeSeries, priceLowTimeSeries, 14, 3);

stochasticDStream.subscribe((point) => {
    console.log( `Date: ${point.d}, Value: ${point.v} ${bfxTo}`);
});
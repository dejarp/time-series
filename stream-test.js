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
var fifteenMinutes = 15 * oneMinute;


var twentyFourHoursAgo = new Date();
twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
var cycleLength = fifteenMinutes;
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

var priceDataSource = new Rx.Subject();
request.get( 
    `${url}/candles/trade:${bfxTimeFrames[cycleLength]}:t${bfxPairId}/hist`,
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
            priceDataSource.next(streamPoint);
        });
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
            priceDataSource.next(streamPoint);
        });
});

bws.on('error', console.error)

var alignedPriceData = priceDataSource
    //.do(point => console.log(`Prealignment: Date: ${point.d}, Value: ${point.v}`))
    .map(streamPoint => ({
        d: new Date(Math.floor(streamPoint.d.getTime() / cycleLength) * cycleLength),
        v: streamPoint.v
    }))
    //.do(point => console.log(`Postalignment: Date: ${point.d}, Value: ${point.v}`))
    ;

var priceTimeSeries = cycles
    .merge(alignedPriceData)
    .scan((accumulator, dateOrPoint) => {
        accumulator.pointsToEmit = [];
        var index;
        if(_.isDate(dateOrPoint)) {
            var date = dateOrPoint;
            index = _.sortedIndexBy(accumulator.bins, { date: date }, bin => bin.date);
            if(!accumulator.bins[index]) {
                // the array is empty, go ahead and insert
                accumulator.bins.push({
                    date: date,
                    inDomain: true,
                    points: []
                });
            } else {
                // the bin exists, we either need to modify it or insert after it
                if(accumulator.bins[index].date.getTime() === date.getTime()) {
                    accumulator.bins[index].inDomain = true
                } else {
                    accumulator.bins.splice(index, 0, {
                        date: date,
                        inDomain: true,
                        points: []
                    });
                }
            }
        } else {
            var point = dateOrPoint;
            if(accumulator.currentDate && accumulator.currentDate.getTime() === point.d.getTime()) {
                accumulator.pointsToEmit = [ point ];
            } else {
                index = _.sortedIndexBy(accumulator.bins, { date: point.d }, bin => bin.date);
                if(!accumulator.bins[index]) {
                    accumulator.bins.push({
                        date: point.d,
                        inDomain: false,
                        points: [ point ]
                    });
                } else {
                    if(accumulator.bins[index].date.getTime() === point.d.getTime()) {
                        accumulator.bins[index].points.push(point);
                    } else {
                        accumulator.bins.splice(index, 0, {
                            date: point.d,
                            inDomain: false,
                            points: [ point ]
                        });
                    }
                }
            }
        }

        // at this point the date or point should have been added
        // need to see if that bin is full (has a date and point(s))
        // if it is full, 
        if( accumulator.bins[index]
            && accumulator.bins[index].inDomain 
            && !_.isEmpty(accumulator.bins[index].points)
        ) {
            accumulator.currentDate = accumulator.bins[index].date;
            accumulator.pointsToEmit = accumulator.bins[index].points;
            accumulator.bins.splice(0, index + 1);
        }

        return accumulator;
    }, {
        currentDate: null,
        pointsToEmit: [],
        bins: []
    })
    .flatMap(accumulator => accumulator.pointsToEmit)
    //.do(point => console.log(`PricePoint: Date: ${point.d}, Value: ${point.v}`))
    ;


function MovingWindow(timeSeries, periods) {
    return timeSeries
        .scan((window, point) => {
            if(_.isEmpty(window)) {
                window.push(point);
            } else {
                if(window[window.length-1].d.getTime() === point.d.getTime()) {
                    window[window.length-1] = point;
                } else {
                    return _(window).takeRight(periods-1).push(point).value();
                }
            }
            return window;
        }, [])
        .filter(window => window.length === periods)
        //.do(window => console.log(window));
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

function BollingerBandLower(timeSeries, periods, multiplier) {
    return Subtract(
        SimpleMovingAverage(timeSeries, periods),
        MultiplyBy(
            StandardDeviation(timeSeries, periods), multiplier
        )
    )
}

var bollingerBandLowerSeries = BollingerBandLower(priceTimeSeries, periods, multiplier);

bollingerBandLowerSeries.subscribe((point) => {
    console.log( `Date: ${point.d}, Value: ${point.v} ${bfxTo}`);
});
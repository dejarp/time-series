const Rx = require('rxjs');
const bfxPriceSeries = require('./bfx-price-series');
const BollingerBandLower = require('./bollinger-band-lower');
const StochasticD = require('./stochastic-d');
const Collate = require('./collate');

var oneSecond = 1000;
var fiveSeconds = 5 * oneSecond;
var oneMinute = 60 * oneSecond;
var fiveMinutes = 5 * oneMinute;
var fifteenMinutes = 15 * oneMinute;

var bfxFrom = 'IOT';
var bfxTo = 'BTC';

var periods = 14;
var smoothingPeriods = 3;

var series = bfxPriceSeries(bfxFrom, bfxTo, oneMinute);

var stochasticDStream = StochasticD(
    series.closes, 
    series.highs, 
    series.lows, 
    periods,
    smoothingPeriods);

function OscillatorStrategy(oscillatorStream, buyLevel, sellLevel) {
    return oscillatorStream
        .map(point => {
            var action;
            if(point.v <= buyLevel) {
                action = 'BUY';
            } else if(point.v >= sellLevel) {
                action = 'SELL';
            } else {
                action = 'HOLD';
            }
            return {
                d: point.d,
                v: action
            };
        });
}

var strategyStream = OscillatorStrategy(stochasticDStream, 20, 80);

var balanceStream = Collate({
    price: series.closes,
    action: strategyStream})
    .scan((accumulator, collection) => {
        accumulator.date = collection.price.d;
        if(accumulator.action !== collection.action.v) {
            accumulator.action = collection.action.v;
            if(collection.action.v === 'BUY') {
                accumulator.balances.IOT += accumulator.balances.BTC / collection.price.v;
                accumulator.balances.BTC = 0;
            } else if(collection.action.v === 'SELL') {
                accumulator.balances.BTC += accumulator.balances.IOT * collection.price.v;
                accumulator.balances.IOT = 0;
            }
        }
        return accumulator;
    }, {
        date: null,
        action: null,
        balances: {
            IOT: 0,
            BTC: 1,
        }
    });

balanceStream.subscribe(accumulator => console.log(accumulator));

// strategyStream.subscribe((point) => {
//     console.log( `Date: ${point.d}, Value: ${point.v}`);
// });
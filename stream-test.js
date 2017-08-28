const bfxPriceSeries = require('./bfx-price-series');
const BollingerBandLower = require('./bollinger-band-lower');
const StochasticD = require('./stochastic-d');

var oneSecond = 1000;
var fiveSeconds = 5 * oneSecond;
var oneMinute = 60 * oneSecond;
var fiveMinutes = 5 * oneMinute;
var fifteenMinutes = 15 * oneMinute;

var bfxFrom = 'IOT';
var bfxTo = 'BTC';

var periods = 14;
var smoothingPeriods = 3;

var series = bfxPriceSeries(bfxFrom, bfxTo, fiveMinutes);

var stochasticDStream = StochasticD(
    series.closes, 
    series.highs, 
    series.lows, 
    periods,
    smoothingPeriods);

stochasticDStream.subscribe((point) => {
    console.log( `Date: ${point.d}, Value: ${point.v} ${bfxTo}`);
});
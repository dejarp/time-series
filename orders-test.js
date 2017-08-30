const bfxTimeSeries = require('./bfx-time-series');

var oneSecond = 1000;
var fiveSeconds = 5 * oneSecond;
var oneMinute = 60 * oneSecond;
var fiveMinutes = 5 * oneMinute;
var fifteenMinutes = 15 * oneMinute;

var bfxFrom = 'IOT';
var bfxTo = 'BTC';

var series = bfxTimeSeries(bfxFrom, bfxTo, oneMinute);

var balances = series.balances;

balances.subscribe((balances) => {
    console.log(balances);
});
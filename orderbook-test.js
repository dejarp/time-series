const bfxPriceSeries = require('./bfx-price-series');

var oneSecond = 1000;
var fiveSeconds = 5 * oneSecond;
var oneMinute = 60 * oneSecond;
var fiveMinutes = 5 * oneMinute;
var fifteenMinutes = 15 * oneMinute;

var bfxFrom = 'IOT';
var bfxTo = 'BTC';

var series = bfxPriceSeries(bfxFrom, bfxTo, oneMinute);

series.bids.subscribe((bid) => {
    console.log(bid);
});
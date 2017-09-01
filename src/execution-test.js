const _ = require('lodash');
const Rx = require('rxjs');
const bfxTimeSeries = require('./bfx-time-series');
const BollingerBandLower = require('./bollinger-band-lower');
const StochasticD = require('./stochastic-d');
const Periods = require('./periods');
const Collate = require('./collate');

const bfxFrom = 'IOT';
const bfxTo = 'BTC';
var series = bfxTimeSeries(bfxFrom, bfxTo, Periods.fiveMinutes);

var periods = 14;
var smoothingPeriods = 3;
var stochasticDSeries = StochasticD(
    series.closes,
    series.highs,
    series.lows,
    periods,
    smoothingPeriods
);

var collatedSeries = Collate({
    close: series.closes,
    high: series.highs,
    low: series.lows
});

var prettyCollatedSeries = collatedSeries
    .map(data => ({
        d: data[_.first(_.keys(data))].d,
        v: _.mapValues(data, frame => frame.v)
    }));

stochasticDSeries.subscribe((data) => {
    console.log(data);
});
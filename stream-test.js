const _ = require('lodash');
const Rx = require('rxjs');
const bfxTimeSeries = require('./bfx-time-series');
const BollingerBandLower = require('./bollinger-band-lower');
const StochasticD = require('./stochastic-d');
const StochasticK = require('./stochastic-k');
const Collate = require('./collate');

var oneSecond = 1000;
var fiveSeconds = 5 * oneSecond;
var oneMinute = 60 * oneSecond;
var fiveMinutes = 5 * oneMinute;
var fifteenMinutes = 15 * oneMinute;

var bfxFrom = 'IOT';
var bfxTo = 'BTC';
var bfxSymbol = `t${bfxFrom}${bfxTo}`;

var series = bfxTimeSeries(bfxFrom, bfxTo, oneMinute);

var periods = 14;
var smoothingPeriods = 3;

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

var decisionStream = Collate({
    last: series.closes,
    stochastic: stochasticDStream,
    balances: series.balances,
    action: strategyStream});

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
    }
);

var orderStream = decisionStream
    .distinctUntilChanged((decision1, decision2) => {
        function getRelevantChanges(decision) {
            // if either the action or the balance changes it may indicate that a new action should
            // be taken as it relates to new or outstanding orders. For a new balance, it may indicate
            // that there are now enough funds to buy or sell
            return _(decision).pick(['action', 'balances']).mapValues('v').value();
        }
        return _.isEqual(getRelevantChanges(decision1), getRelevantChanges(decision2));
    })
    .do(console.log)
    .map(decisionBase => {
        if(decisionBase.action.v === 'HOLD') {
            return {
                action: 'CANCEL ALL ORDERS'
            };
        } else if(decisionBase.action.v === 'BUY') {
            if(decisionBase.balances.v[bfxTo] > 0) {
                return {
                    action: 'BUY',
                    amount: decisionBase.balances.v[bfxTo] / decisionBase.last.v,
                    price: decisionBase.last.v
                };
            } else {
                // do nothing, because there isn't enough balance
            }
        } else if(decisionBase.action.v === 'SELL') {
            if(decisionBase.balances.v[bfxFrom] > 0) {
                return {
                    action: 'SELL',
                    amount: -1 * decisionBase.balances.v[bfxFrom],
                    price: decisionBase.last.v
                };
            }
        }
    });

orderStream.subscribe(decision => {
    console.log(decision);
    if(decision.action === 'CANCEL ALL ORDERS') {
        // TODO: merge the order id's into the decision so that they can be canceled
    } else if(decision.action === 'BUY') {
        series.orderSubject.next({
            bfxSymbol: bfxSymbol,
            // the .01 and price modifications are there so that the trade isn't actually
            // executed and so that if it is that it isn't too bad
            amount: decision.amount * .01,
            price: decision.price - (decision.price / 2)
        });
    } else if(decision.action === 'SELL') {
        series.orderSubject.next({
            bfxSymbol: bfxSymbol,
            amount: decision.amount * .01,
            price: decision.price + (decision.price / 2)
        });
    }
});

// TODO: merge in order id's and get cancelation working
// TODO: run it and let it make a trade!
// TODO: once a successful trade has been made, start refactoring and getting a test framework set up
// TODO: start thinking about how decisions and actions will stack in the final product
// TODO: start thinking about what the streams need to look like to make this support multiple exchanges

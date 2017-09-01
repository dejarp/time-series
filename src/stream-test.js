"use strict";
// @flow
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const time_series_1 = require("./exchange/bitfinex/time-series");
const stochastic_d_1 = require("./stochastic-d");
const collate_1 = require("./collate");
const periods_1 = require("./periods");
var bfxFrom = 'IOT';
var bfxTo = 'BTC';
var bfxSymbol = `t${bfxFrom}${bfxTo}`;
var series = time_series_1.BfxTimeSeries(bfxFrom, bfxTo, periods_1.default.fiveMinutes, false);
var periods = 14;
var smoothingPeriods = 3;
var stochasticDStream = stochastic_d_1.StochasticD(series.closes, series.highs, series.lows, periods, smoothingPeriods)
    .do(point => console.log(point.v));
function OscillatorStrategy(oscillatorStream, buyLevel, sellLevel) {
    return oscillatorStream
        .map(point => {
        var action;
        if (point.v <= buyLevel) {
            action = 'BUY';
        }
        else if (point.v >= sellLevel) {
            action = 'SELL';
        }
        else {
            action = 'HOLD';
        }
        return {
            d: point.d,
            v: action
        };
    });
}
var strategyStream = OscillatorStrategy(stochasticDStream, 15, 85);
var decisionStream = collate_1.Collate({
    last: series.closes,
    stochastic: stochasticDStream,
    balances: series.balances,
    activeOrders: series.activeOrders,
    action: strategyStream
});
var balanceStream = collate_1.Collate({
    price: series.closes,
    action: strategyStream
})
    .scan((accumulator, collection) => {
    accumulator.date = collection.price.d;
    if (accumulator.action !== collection.action.v) {
        accumulator.action = collection.action.v;
        if (collection.action.v === 'BUY') {
            accumulator.balances.IOT += accumulator.balances.BTC / collection.price.v;
            accumulator.balances.BTC = 0;
        }
        else if (collection.action.v === 'SELL') {
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
    .map(decisionBase => {
    if (decisionBase.action.v === 'HOLD') {
        return {
            action: 'CANCEL ALL ORDERS',
            orderIds: _(decisionBase.activeOrders.v).values().map('id').value()
        };
    }
    else if (decisionBase.action.v === 'BUY') {
        if (decisionBase.balances.v[bfxTo] > 0) {
            return {
                action: 'BUY',
                // Multiply by .999 to account for fees, which would make the order invalid
                // TODO: factor in the fees using a different stream
                amount: .999 * decisionBase.balances.v[bfxTo] / decisionBase.last.v,
                price: decisionBase.last.v
            };
        }
        else {
            // do nothing, because there isn't enough balance
        }
    }
    else if (decisionBase.action.v === 'SELL') {
        if (decisionBase.balances.v[bfxFrom] > 0) {
            return {
                action: 'SELL',
                amount: -1 * decisionBase.balances.v[bfxFrom],
                price: decisionBase.last.v
            };
        }
        else {
            // do nothing, not enough balance
        }
    }
})
    .filter(decision => !_.isUndefined(decision))
    .share();
var cancelOrdersStream = orderStream
    .filter(decision => decision.action === 'CANCEL ALL ORDERS');
var buyOrders = orderStream
    .filter(decision => decision.action === 'BUY');
var sellOrders = orderStream
    .filter(decision => decision.action === 'SELL');
var buySellCancelStream = buyOrders
    .merge(sellOrders)
    .distinctUntilChanged((decision1, decision2) => decision1.action === decision2.action)
    .merge(cancelOrdersStream)
    .do(console.log);
buySellCancelStream.subscribe(decision => {
    if (decision.action === 'CANCEL ALL ORDERS') {
        series.orderCancelAllSubject.next(decision.orderIds);
        // TODO: merge the order id's into the decision so that they can be canceled
    }
    else if (decision.action === 'BUY') {
        series.orderSubject.next({
            bfxSymbol: bfxSymbol,
            // the .1 and price modifications are there so that the trade isn't actually
            // executed and so that if it is that it isn't too bad
            amount: decision.amount,
            price: decision.price
        });
    }
    else if (decision.action === 'SELL') {
        // series.orderSubject.next({
        //     bfxSymbol: bfxSymbol,
        //     amount: decision.amount * .1,
        //     price: decision.price
        // });
    }
});
// TODO: run it and let it make a trade (buy and sell)!
// TODO: once a successful trade has been made, start refactoring and getting a test framework set up
// TODO: start thinking about how decisions and actions will stack in the final product
// TODO: start thinking about what the streams need to look like to make this support multiple exchanges
// TODO: factor in fees 

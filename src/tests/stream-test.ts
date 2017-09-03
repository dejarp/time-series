import * as _ from 'lodash';
import * as Rx from 'rxjs';
import PriceCloseSeries from '../exchanges/bitfinex/price-close-series';
import PriceLowSeries from '../exchanges/bitfinex/price-low-series';
import PriceHighSeries from '../exchanges/bitfinex/price-high-series';

import StochasticD from '../indicators/stochastic-d';
import StochasticK from '../indicators/stochastic-k';
import Collate from '../core/operators/collate';
import Periods from '../periods';

import PriceCloseRealTime from '../exchanges/bitfinex/price-close-real-time';

const API_KEY = 'g0iI9DsJmEuLnZDIHJFXsm1DaJpqvA4TDQZlOslyYjA'
const API_SECRET = 'ONXjRxvFdy7XgPIO6HBn2gQx2sjLb3YGdLRc60etZPc'

let bfxFrom = 'IOT';
let bfxTo = 'BTC';
let bfxSymbol = `t${bfxFrom}${bfxTo}`;

let periods = 14;
let smoothingPeriods = 3;

let cycleLength = Periods.fiveMinutes;

// At the moment, if real time is concated after historical, real time never ticks
let closeSeries = PriceCloseSeries(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength);
//let lowSeries = PriceLowSeries(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength);
//let highSeries = PriceHighSeries(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength);

let historicalDataAligned = PriceCloseRealTime(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength);

//let stochasticDStream = StochasticD(closeSeries, highSeries, lowSeries, periods, smoothingPeriods)

closeSeries.subscribe(console.log);

// function OscillatorStrategy(oscillatorStream, buyLevel, sellLevel) {
//     return oscillatorStream
//         .map(point => {
//             var action;
//             if(point.v <= buyLevel) {
//                 action = 'BUY';
//             } else if(point.v >= sellLevel) {
//                 action = 'SELL';
//             } else {
//                 action = 'HOLD';
//             }
//             return {
//                 d: point.d,
//                 v: action
//             };
//         });
// }

// var strategyStream = OscillatorStrategy(stochasticDStream, 15, 85);

// var decisionStream = Collate({
//     last: series.closes,
//     stochastic: stochasticDStream,
//     balances: series.balances,
//     activeOrders: series.activeOrders,
//     action: strategyStream});

// var orderStream = decisionStream
//     .distinctUntilChanged((decision1, decision2) => {
//         function getRelevantChanges(decision) {
//             // if either the action or the balance changes it may indicate that a new action should
//             // be taken as it relates to new or outstanding orders. For a new balance, it may indicate
//             // that there are now enough funds to buy or sell
//             return _(decision).pick(['action', 'balances']).mapValues('v').value();
//         }
//         return _.isEqual(getRelevantChanges(decision1), getRelevantChanges(decision2));
//     })
//     .map(decisionBase => {
//         if(decisionBase.v.action.v === 'HOLD') {
//             return {
//                 action: 'CANCEL ALL ORDERS',
//                 orderIds: _(decisionBase.v.activeOrders.v).values().map('id').value()
//             };
//         } else if(decisionBase.v.action.v === 'BUY') {
//             if(decisionBase.v.balances.v[bfxTo] > 0) {
//                 return {
//                     action: 'BUY',
//                     // Multiply by .999 to account for fees, which would make the order invalid
//                     // TODO: factor in the fees using a different stream
//                     amount: .999 * decisionBase.v.balances.v[bfxTo] / decisionBase.v.last.v,
//                     price: decisionBase.v.last.v
//                 };
//             } else {
//                 // do nothing, because there isn't enough balance
//             }
//         } else if(decisionBase.v.action.v === 'SELL') {
//             if(decisionBase.v.balances.v[bfxFrom] > 0) {
//                 return {
//                     action: 'SELL',
//                     amount: -1 * decisionBase.v.balances.v[bfxFrom],
//                     price: decisionBase.v.last.v
//                 };
//             } else {
//                 // do nothing, not enough balance
//             }
//         }
//     })
//     .filter(decision => !_.isUndefined(decision))
//     .share();

// var cancelOrdersStream = orderStream
//     .filter(decision => decision.action === 'CANCEL ALL ORDERS');

// var buyOrders = orderStream
//     .filter(decision => decision.action === 'BUY')

// var sellOrders = orderStream
//     .filter(decision => decision.action === 'SELL');

// var buySellCancelStream = buyOrders
//     .merge(sellOrders)
//     .distinctUntilChanged((decision1, decision2) => decision1.action === decision2.action)
//     .merge(cancelOrdersStream)
//     .do(console.log);

// buySellCancelStream.subscribe(decision => {
//     if(decision.action === 'CANCEL ALL ORDERS') {
//         series.orderCancelAllSubject.next(decision.orderIds);
//         // TODO: merge the order id's into the decision so that they can be canceled
//     } else if(decision.action === 'BUY') {
//         series.orderSubject.next({
//             bfxSymbol: bfxSymbol,
//             // the .1 and price modifications are there so that the trade isn't actually
//             // executed and so that if it is that it isn't too bad
//             amount: decision.amount,
//             price: decision.price
//         });
//     } else if(decision.action === 'SELL') {
//         // series.orderSubject.next({
//         //     bfxSymbol: bfxSymbol,
//         //     amount: decision.amount * .1,
//         //     price: decision.price
//         // });
//     }
// });

// TODO: clean up bitfinex series stuff
// TODO: start thinking about how decisions and actions will stack in the final product
// TODO: start thinking about what the streams need to look like to make this support multiple exchanges
// TODO: factor in fees
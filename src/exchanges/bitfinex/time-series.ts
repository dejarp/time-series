import * as _ from 'lodash';
import * as Rx from 'rxjs';
import AlignToDates from '../../core/operators/align-to-dates';
import BinHigh from '../../core/operators/bin-high';
import BinLow from '../../core/operators/bin-low';
import BinOpen from '../../core/operators/bin-open';
import BinClose from '../../core/operators/bin-close';
import CarryForward from '../../core/operators/carry-forward';
import TimeSeries from '../../core/time-series';
import TimeSeriesPoint from '../../core/time-series-point';
import PriceOpenSeries from './price-open-series';
import PriceCloseSeries from './price-close-series';
import PriceLowSeries from './price-low-series';
import PriceHighSeries from './price-high-series';
import RealTimeData from './real-time-data';
import DateDomain from './date-domain';

export default function BfxTimeSeries(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number, loggingEnabled: boolean) {
    var bfxSymbol = `t${bfxFrom}${bfxTo}`;

    let dates = DateDomain(cycleLength);

    var walletSubject = new Rx.Subject();
    var activeOrdersSubject = new Rx.Subject();

    var bookChannelId;
    var orderbook = {
        bids: [],
        asks: []
    };

    // var groupedOrderbookDataSource = orderbookDataSource
    //     .map(orderbook => {
    //         return {
    //             d: orderbook.d,
    //             v: {
    //                 bids: _(orderbook.v.bids)
    //                     .groupBy(bid => bid.price.toFixed(7))
    //                     .map(groupedBids => ({
    //                         price: parseFloat(groupedBids[0].price.toFixed(7)),
    //                         amount: _(groupedBids).map('amount').sum(),
    //                         count: _(groupedBids).map('count').sum()
    //                     }))
    //                     .value(),
    //                 asks: _(orderbook.v.asks)
    //                     .groupBy(ask => ask.price.toFixed(7))
    //                     .map(groupedAsks => ({
    //                         price: parseFloat(groupedAsks[0].price.toFixed(7)),
    //                         amount: _(groupedAsks).map('amount').sum(),
    //                         count: _(groupedAsks).map('count').sum()
    //                     }))
    //                     .value()
    //             }
    //         }
    //     });

    // var bidAskDataSource = groupedOrderbookDataSource
    //     .map(orderbook => ({
    //         d: orderbook.d,
    //         v: {
    //             bid: _.last(orderbook.v.bids),
    //             ask: _.first(orderbook.v.asks)
    //         }
    //     }))
    //     .distinctUntilChanged(_.isEqual)

    // var bidsDataSource = bidAskDataSource
    //     .map(bidAsk => ({
    //         d: bidAsk.d,
    //         v: bidAsk.v.bid.price
    //     }));

    // var asksDataSource = bidAskDataSource
    //     .map(bidAsk => ({
    //         d: bidAsk.d,
    //         v: bidAsk.v.ask.price
    //     }));

    // Note: there is a bug here with concat and how it interacts with bitfinex api. The real time
    //       subscription will happen after the bin has been started most of the time, and since the
    //       historical fetch didn't fetch the current low or high, then the low or high as calculated
    //       here on the fly could be incorrect. To fix this, there needs to be a way to get the low and
    //       high of the current bin, or you can wait until the next bin to begin trading on more accurate data.
    //var bidsTimeSeries = AlignToDates(bidsDataSource, dates).distinctUntilChanged(_.isEqual);
    // var asksTimeSeries = AlignToDates(asksDataSource, dates).distinctUntilChanged(_.isEqual);

    // function placeLimitOrder(symbol, amount, price) {
    //     var cid = new Date().getTime();
    //     const order = [ 0, 'on', null, {
    //         cid: cid,
    //         // EXCHANGE LIMIT is only different from LIMIT in which funds it is using
    //         type: 'EXCHANGE LIMIT',
    //         symbol: symbol,
    //         amount: amount.toString(),
    //         price: price.toString(),
    //         hidden: 0
    //     } ];
    //     bfxAPI.ws.submitOrder(order);
    // }

    // var orderSubject: Rx.Subject<any> = new Rx.Subject();
    // orderSubject.subscribe(order => {
    //     placeLimitOrder(order.bfxSymbol, order.amount, order.price);
    // });

}
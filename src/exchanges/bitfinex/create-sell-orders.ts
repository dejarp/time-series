import * as _ from 'lodash';
import * as Rx from 'rxjs';
import ApiInstance from './api-instance'; 
import TimeSeries from '../../core/time-series';
import TimeSeriesPoint from '../../core/time-series-point';
import BalancesSeries from './balances-series';
import {BfxBalances} from './balances-series';
import CollateBy from '../../core/operators/collate-by';
import PriceSeries from './price-close-series';

export default function CreateSellOrders(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number, timeSeries: TimeSeries<any>, allocation: number) {
    let bfxApi = ApiInstance(apiKey, apiSecret);
    let balances = BalancesSeries(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength);
    let prices = PriceSeries(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength);

    return CollateBy([balances, prices, timeSeries])
        .distinctUntilChanged(_.isEqual)
        .do((results : TimeSeriesPoint<TimeSeriesPoint<any>[]>) => {
            var price = results.v[1].v;
            var fromBalance = results.v[0].v['exchange'][bfxFrom].balance; // ex. MIOTA
            var toBalance = results.v[0].v['exchange'][bfxTo].balance; // ex. BTC
            var totalFromBalance = fromBalance + (toBalance / price);
            var totalToBalance = toBalance + (fromBalance * price);
            var totalTradableFromBalance = (allocation * totalFromBalance) - (toBalance / price);

            console.log('Creating sell order: ');

            if(totalTradableFromBalance <= 0) {
                console.log('already reached allocation')
                // can't do anything
                return;
            }

            var desiredPrice = results.v[1].v * 1.25;
            var desiredAmount = .999 * totalTradableFromBalance * -1;
            var symbol = `t${bfxFrom}${bfxTo}`;
            var cid = new Date().getTime();

            let orderPacket = [
                0,
                'on',
                null,
                {
                    cid: cid,
                    type: 'EXCHANGE LIMIT',
                    symbol: symbol,
                    // TODO: factor in fees to how much can be purchased
                    amount: `${desiredAmount}`,
                    price: `${desiredPrice}`,
                    hidden: 0
                }
            ];

            console.log(orderPacket);
            //bfxApi.ws.send(orderPacket);
        });
}
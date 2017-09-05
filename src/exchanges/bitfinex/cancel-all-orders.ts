import * as _ from 'lodash';
import * as Rx from 'rxjs';
import ApiInstance from './api-instance';
import TimeSeries from '../../core/time-series';
import TimeSeriesPoint from '../../core/time-series-point';
import {BfxActiveOrders} from './active-orders-series';
import {BfxOrder} from './websocket-order-series';
import ActiveOrders from './active-orders-series';
import CollateBy from '../../core/operators/collate-by';

// Note: the docs say that orders can be canceled using the cid and cid_date
//       but I have found that to not be the case. It will always display the
//       "order not found" message in bitfinex. I don't know if this happens
//       due to misuse of the API or a bug on their end. Leaning towards latter.
export default function CancelAllOrders(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number, timeSeries: TimeSeries<any>) {
    let bfxApi = ApiInstance(apiKey, apiSecret);
    let activeOrders = ActiveOrders(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength);

    return CollateBy([activeOrders.do(bla => {
        console.log(bla);
    }), timeSeries])
        .do((orders : TimeSeriesPoint<[BfxActiveOrders, number]>) => {
            _.forEach(orders.v[0].v, (order: BfxOrder, orderId) => {
                bfxApi.ws.send([
                    0,
                    'oc',
                    null,
                    {
                        id: order.id
                    }
                ]);
            });
        })
}
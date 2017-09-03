import * as _ from 'lodash';
import WebsocketOrders from './websocket-order-series';
import {BfxOrder, BfxOrderPacket} from './websocket-order-series';
import TimeSeries from '../../core/time-series';
import TimeSeriesPoint from '../../core/time-series-point';

type BfxActiveOrders = {
    [key: string]: BfxOrder
};

let OrderMap = (orders: BfxOrder[], activeOrders: {[key: string]: BfxOrder}) : {[key: string]: BfxOrder} => _.transform(orders, (accumulator, order) => {
    _.set(accumulator, order.id, order);
}, activeOrders);

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<BfxActiveOrders> {
    return WebsocketOrders(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength)
        .scan((activeOrders, orderPacket: TimeSeriesPoint<BfxOrderPacket>) => {
            let newActiveOrders;
            switch(orderPacket.v.type) {
                case 'os':
                    newActiveOrders = OrderMap(orderPacket.v.orders, {});
                case 'on':
                case 'ou':
                    newActiveOrders = _.merge({}, activeOrders.v, OrderMap(orderPacket.v.orders, {}));
                case 'oc':
                    newActiveOrders = _.omit(activeOrders, _.map(orderPacket.v.orders, 'id'));
                default:
                    console.error('hey, this should not happen ever.. investigate');
            }

            return {
                d: orderPacket.d,
                v: newActiveOrders
            };
        }, {
            d: new Date(),
            v: {}
        });
} 
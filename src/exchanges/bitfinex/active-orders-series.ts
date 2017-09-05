import * as _ from 'lodash';
import WebsocketOrders from './websocket-order-series';
import {BfxOrder, BfxOrderPacket, BfxOrderPacketTypes} from './websocket-order-series';
import TimeSeries from '../../core/time-series';
import TimeSeriesPoint from '../../core/time-series-point';
import DateDomain from './date-domain';
import BinByCycleLength  from '../../core/operators/bin-by-cycle-length';
import CarryForward from '../../core/operators/carry-forward';

export type BfxActiveOrders = {
    [key: string]: BfxOrder
};

let OrderMap = (orders: BfxOrder[], activeOrders: {[key: string]: BfxOrder}) : {[key: string]: BfxOrder} => _.transform(orders, (accumulator, order) => {
    _.set(accumulator, order.id, order);
}, activeOrders);

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<BfxActiveOrders> {
    return CarryForward(
        BinByCycleLength(
            WebsocketOrders(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength)
                .scan((activeOrders, orderPacket: TimeSeriesPoint<BfxOrderPacket>) => {
                    let newActiveOrders;

                    if(orderPacket.v.type === BfxOrderPacketTypes.os) {
                        newActiveOrders = OrderMap(orderPacket.v.orders, {});
                    } else if(orderPacket.v.type === BfxOrderPacketTypes.on || orderPacket.v.type === BfxOrderPacketTypes.ou) {
                        newActiveOrders = _.merge({}, activeOrders.v, OrderMap(orderPacket.v.orders, {}));
                    } else if(orderPacket.v.type === BfxOrderPacketTypes.oc) {
                        newActiveOrders = _.omit(activeOrders.v, _.map(orderPacket.v.orders, 'id'));
                    } else {
                        console.error('hey, this should not happen ever.. investigate');
                    }

                    return {
                        d: orderPacket.d,
                        v: newActiveOrders
                    };
                }, {
                    d: new Date(),
                    v: {}
                }),
            cycleLength
        ),
        DateDomain(cycleLength)
    );
} 
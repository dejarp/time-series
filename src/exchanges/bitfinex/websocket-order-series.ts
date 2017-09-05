import * as _ from 'lodash';
import * as Rx from 'rxjs';
import WebsocketSeries from './websocket-series';
import TimeSeries from '../../core/time-series';

type BfxOrderType = 'LIMIT'|'MARKET'|'STOP'|'TRAILING STOP'|'EXCHANGE MARKET'|'EXCHANGE LIMIT'|'EXCHANGE STOP'|'EXCHANGE TRAILING STOP'|'FOK'|'EXCHANGE FOK';
type BfxOrderStatus = 'ACTIVE'|'EXECUTED'|'PARTIALLY FILLED'|'CANCELED';

export type BfxOrder = {
    id: number,
    gid: number,
    cid: number,
    symbol: string,
    created: Date,
    updated: Date,
    amount: number,
    amountOriginal: number,
    type: BfxOrderType,
    typePrevious: BfxOrderType,
    flags: number,
    orderStatus: BfxOrderStatus,
    price: number,
    priceAverage: number,
    priceTrailing: number,
    priceAuxiallaryLimit: number,
    notify: boolean,
    hidden: boolean,
    placedId: number
};

export enum BfxOrderPacketTypes {
    os,
    on,
    ou,
    oc
};

export type BfxOrderPacket = {
    type: BfxOrderPacketTypes,
    orders: BfxOrder[]
};

let orderMessageStringsToTypesEnum = {
    'os': BfxOrderPacketTypes.os,
    'on': BfxOrderPacketTypes.on,
    'ou': BfxOrderPacketTypes.ou,
    'oc': BfxOrderPacketTypes.oc
};

function orderPacketToOrderObject(order) : BfxOrder {
    return {
        id: order[0],
        gid: order[1],
        cid: order[2],
        symbol: order[3],
        created: new Date(order[4]),
        updated: new Date(order[5]),
        amount: order[6],
        amountOriginal: order[7],
        type: order[8],
        typePrevious: order[9],
        // placeholder1: order[10],
        // placeholder2: order[11],
        flags: order[12],
        orderStatus: order[13],
        // placeholder3: order[14],
        // placeholder4: order[15],
        price: order[16],
        priceAverage: order[17],
        priceTrailing: order[18],
        priceAuxiallaryLimit: order[19],
        // placeholder5: order[20],
        // placeholder6: order[21],
        // placeholder7: order[22],
        notify: order[23],
        hidden: order[24],
        placedId: order[25]
    };
}

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<BfxOrderPacket> {
    let orderMessages = WebsocketSeries(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength)
        .filter(packet => _.has(orderMessageStringsToTypesEnum, packet.v.type))
    
    let orderSnapshotMessages = orderMessages
        .filter(packet => packet.v.type === 'os')
        .map(packet => {
            return {
                d: new Date(),
                v: {
                    type: orderMessageStringsToTypesEnum[packet.v.type],
                    orders: _.map(packet.v.payload, orderPacketToOrderObject)
                }
            }
        });

    let orderNewUpdateCancelMessages = orderMessages
        .filter(packet => packet.v.type !== 'os')
        .map(packet => {
            return {
                d: new Date(),
                v: {
                    type: orderMessageStringsToTypesEnum[packet.v.type],
                    orders: [ orderPacketToOrderObject(packet.v.payload)]
                }
            };
        });

    return Rx.Observable.merge(orderSnapshotMessages, orderNewUpdateCancelMessages);
}
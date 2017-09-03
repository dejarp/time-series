import * as _ from 'lodash';
import * as Rx from 'rxjs';
import WebsocketSeries from './websocket-series';
import TimeSeries from '../../core/time-series';

let orderMessageTypes = {
    // Note: ts is manufactured by this library to make up for an inconsistency within the bitfinex websocket protocol
    'ts': true,
    'te': true,
    // implement once it's clear how trade updates plays into calculation
    'tu': true
};

export type BfxTrade = {
    id: number,
    date: Date,
    amount: number,
    price: number
};

let convertTradeToObject = (payload) : BfxTrade => ({
    id: payload[0],
    date: new Date(payload[1]),
    amount: payload[2],
    price: payload[3]
});

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    let tradeMessages = WebsocketSeries(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength)
    let tradesInSnapshot = tradeMessages
        .filter(packet => packet.v.type === 'ts')
        // the trades in the ts message are in the reverse order <.<
        .flatMap(tsMessage => _.reverse(tsMessage.v.payload))
        .map(tradeInSnapshot => convertTradeToObject(tradeInSnapshot));

    let tradesExecutedAfterSnapshot = tradeMessages
        .filter(packet => packet.v.type === 'te')
        .map(teMessage => convertTradeToObject(teMessage.v.payload));

    let tradeUpdates = tradeMessages
        .filter(packet => packet.v.type === 'tu')
        .map(teMessage => convertTradeToObject(teMessage.v.payload));

    return Rx.Observable
        .merge(/* tradesInSnapshot,*/ tradesExecutedAfterSnapshot, tradeUpdates)
        .map(trade => ({
            d: trade.date,
            v: trade.price
        }));
}
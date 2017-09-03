import * as _ from 'lodash';
import * as Rx from 'rxjs';
import * as BitfinexAPI from 'bitfinex-api-node';
import TimeSeriesPoint from '../../core/time-series-point';
import BinByCycleLength from '../../core/operators/bin-by-cycle-length';
import WebsocketTradeSeries from './websocket-trade-series';

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) {
    return BinByCycleLength(
        WebsocketTradeSeries(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength),
        cycleLength);
}

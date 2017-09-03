import * as _ from 'lodash';
import * as Rx from 'rxjs';
import * as httpRequest from 'request-promise';
import TimeSeries from '../../core/time-series';
import TimeSeriesPoint from '../../core/time-series-point';

const url = 'https://api.bitfinex.com/v2';

var bfxTimeFrames = {
    '60000': '1m',
    '300000': '5m',
    '900000': '15m',
    '1800000': '30m',
    '3600000': '1h',
    '10800000': '3h',
    '21600000': '6h',
    '43200000': '12h',
    '86400000': '1D',
    '604800000': '7D',
    '1209600000': '14D'
    // 1M is also supported, but since the length is variable there can
    // be no direct translation.
};

export type BfxCandle = {open: number, close: number, low: number, high: number, volume: number};
let resolveCacheKey = (bfxSymbol: string, cycleLength: number) => `${bfxSymbol}:${cycleLength}`
let HistoricalData = _.memoize((bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<BfxCandle> => Rx.Observable
    .defer(() => Rx.Observable.fromPromise(httpRequest(`${url}/candles/trade:${bfxTimeFrames[cycleLength]}:t${bfxFrom}${bfxTo}/hist`)))
    .map((body: string) => JSON.parse(body))
    .flatMap(candles => _.reverse(candles))
    .map(candle => ({
        d: new Date(candle[0]),
        v: {
            open: candle[1],
            close: candle[2],
            high: candle[3],
            low: candle[4],
            volume: candle[5]
        }
    }))
    .shareReplay(), resolveCacheKey);
export default HistoricalData;
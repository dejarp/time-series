import TimeSeries from '../../core/time-series';
import Candles from './candles';
import Pluck from '../../core/operators/pluck';
import { BfxCandle, CandlesRequestType } from './candles';

export default function HistoricalDataSelector(
    bfxFrom: string, 
    bfxTo: string,
    cycleLength: number,
    candlesRequestType: CandlesRequestType,
    field: 'open'|'close'|'low'|'high'|'volume') : TimeSeries<number> {
    return Pluck(
        Candles(bfxFrom, bfxTo, candlesRequestType, cycleLength), 
        field
    );
};
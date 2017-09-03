import TimeSeries from '../../core/time-series';
import HistoricalData from './historical-data';
import Pluck from '../../core/operators/pluck';
import { BfxCandle } from './historical-data';

export default function HistoricalDataSelector(
    bfxFrom: string, 
    bfxTo: string,
    cycleLength: number, 
    field: 'open'|'close'|'low'|'high'|'volume') : TimeSeries<number> {
    return Pluck(
        HistoricalData(bfxFrom, bfxTo, cycleLength), 
        field
    );
};
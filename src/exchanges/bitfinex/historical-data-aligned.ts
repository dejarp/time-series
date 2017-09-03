import TimeSeries from '../../core/time-series';
import AlignToDates from '../../core/operators/align-to-dates';
import HistoricalData from './historical-data';
import Pluck from '../../core/operators/pluck';
import DateDomain from './date-domain';
import { BfxCandle } from './historical-data';

export default function PriceOpenHistorical(
    bfxFrom: string, 
    bfxTo: string,
    cycleLength: number, 
    field: 'open'|'close'|'low'|'high'|'volume') : TimeSeries<number> {
    return AlignToDates(
        Pluck(
            HistoricalData(bfxFrom, bfxTo, cycleLength), 
            field
        ), 
        DateDomain(cycleLength)
    );
};
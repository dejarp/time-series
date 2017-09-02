import TimeSeries from '../../core/time-series';
import AlignToDates from '../../core/align-to-dates';
import HistoricalData from './historical-date';
import Pluck from '../../core/pluck';
import DateDomain from './date-domain';
import { BfxCandle } from './historical-data';

export default function PriceOpenHistorical(
    bfxSymbol: string, 
    cycleLength: number, 
    field: 'open'|'close'|'low'|'high'|'volume') : TimeSeries<number> {
    return AlignToDates(
        Pluck(
            HistoricalData(bfxSymbol, cycleLength), 
            field
        ), 
        DateDomain(cycleLength)
    );
}
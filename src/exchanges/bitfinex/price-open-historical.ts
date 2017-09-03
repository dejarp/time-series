import TimeSeries from '../../core/time-series';
import HistoricalDataAligned from './historical-data-aligned';

export default function PriceOpenHistorical(bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    return HistoricalDataAligned(bfxFrom, bfxTo, cycleLength, 'open');
}
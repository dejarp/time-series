import TimeSeries from '../../core/time-series';
import HistoricalDataAligned from './historical-data-aligned';

export default function PriceOpenHistorical(bfxSymbol: string, cycleLength: number) : TimeSeries<number> {
    return HistoricalDataAligned(bfxSymbol, cycleLength, 'open');
}
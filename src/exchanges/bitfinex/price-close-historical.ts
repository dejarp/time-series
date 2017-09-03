import TimeSeries from '../../core/time-series';
import HistoricalDataSelector from './historical-data-selector';

export default function PriceCloseHistorical(bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    return HistoricalDataSelector(bfxFrom, bfxTo, cycleLength, 'close');
}
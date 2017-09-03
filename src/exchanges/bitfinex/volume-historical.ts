import TimeSeries from '../../core/time-series';
import HistoricalDataSelector from './historical-data-selector';

export default function VolumeHistorical(bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    return HistoricalDataSelector(bfxFrom, bfxTo, cycleLength, 'volume');
}
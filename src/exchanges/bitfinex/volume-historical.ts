import TimeSeries from '../../core/time-series';
import CandlesSelector from './candles-selector';

export default function VolumeHistorical(bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    return CandlesSelector(bfxFrom, bfxTo, cycleLength, 'hist', 'volume');
}
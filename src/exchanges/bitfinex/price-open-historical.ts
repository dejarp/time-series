import TimeSeries from '../../core/time-series';
import CandlesSelector from './candles-selector';

export default function PriceOpenHistorical(bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    return CandlesSelector(bfxFrom, bfxTo, cycleLength, 'hist', 'open');
}
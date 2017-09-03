import RealTimeData from './real-time-data';
import TimeSeries from '../../core/time-series';
import BinHigh from '../../core/operators/bin-high';

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    return BinHigh(
        RealTimeData(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength)
    );
};
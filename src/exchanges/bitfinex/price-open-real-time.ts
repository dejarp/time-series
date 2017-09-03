import RealTimeData from './real-time-data';
import TimeSeries from '../../core/time-series';
import BinOpen from '../../core/operators/bin-open';

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    return BinOpen(
        RealTimeData(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength)
    );
};
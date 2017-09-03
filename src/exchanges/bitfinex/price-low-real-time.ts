import RealTimeData from './real-time-data';
import TimeSeries from '../../core/time-series';
import BinLow from '../../core/operators/bin-low';

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    return BinLow(
        RealTimeData(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength)
    );
};
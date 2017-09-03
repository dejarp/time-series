import RealTimeData from './real-time-data';
import TimeSeries from '../../core/time-series';
import BinClose from '../../core/operators/bin-close';

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    return BinClose(
        RealTimeData(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength)
    );
};
    
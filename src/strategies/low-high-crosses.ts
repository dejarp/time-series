import * as _ from 'lodash';
import TimeSeries from '../core/time-series';
import TimeSeriesPoint from '../core/time-series';
import CollateAtomic from '../core/operators/collate-atomic';

export default function LowHighCrosses(timeSeries1: TimeSeries<number>, timeSeries2: TimeSeries<number>) : TimeSeries<boolean> {
    return CollateAtomic(
        [timeSeries1, timeSeries2], 
        (series1, series2) => ({
            d: series1.d,
            v: {
                timeSeries1: series1,
                timeSeries2: series2
            }
        }))
        .bufferCount(2,1)
        .filter(buffer => buffer.length === 2)
        .map(buffer => {
            return {
                d: buffer[1].d,
                v: buffer[0].v.timeSeries1.v < buffer[0].v.timeSeries2.v && buffer[1].v.timeSeries1.v >= buffer[1].v.timeSeries2.v
            }
        });
}
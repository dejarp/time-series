import TimeSeries from '../time-series.js';
import TimeSeriesPoint from '../time-series-point.js';

export default function BinWindow<T>(timeSeries: TimeSeries<T>) : TimeSeries<T[]> {
    return timeSeries
        .scan((accumulator, point) => {
            if(accumulator.d === null || accumulator.d.getTime() !== point.d.getTime()) {
                accumulator.d = point.d;
                accumulator.v = [point.v];
            } else {
                accumulator.v.push(point.v);
            }
            return accumulator;
        }, {
            d: new Date(0),
            v: []
        });
};
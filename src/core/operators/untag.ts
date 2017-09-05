import TimeSeries from '../time-series';
import TimeSeriesPoint from '../time-series-point';
import {TimeSeriesTag} from './tag';

export default function Untag<T>(timeSeries: TimeSeries<TimeSeriesTag<T>>) : TimeSeries<T> {
    return timeSeries
        .map(point => ({
            d: point.d,
            v: point.v.value
        }));
};
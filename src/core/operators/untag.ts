import TimeSeries from '../time-series';
import TimeSeriesPoint from '../time-series-point';
import {Tag} from './tag';

export default function Untag<T>(timeSeries: TimeSeries<Tag<T>>) : TimeSeries<T> {
    return timeSeries
        .map(point => ({
            d: point.d,
            v: point.v.value
        }));
};
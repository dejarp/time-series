import * as Rx from 'rxjs';
import TimeSeries from '../core/time-series';

export default function HorizontalLine(timeSeries: TimeSeries<number>, value: number) : TimeSeries<number> {
    return timeSeries
        .map(point => ({
            d: point.d,
            v: value
        }));
};
import * as Rx from 'rxjs';
import TimeSeries from '../core/time-series';

export default function<T>(timeSeries: Rx.Observable<Date>, value: number) : TimeSeries<number> {
    return timeSeries
        .map(date => ({
            d: date,
            v: value
        }));
};
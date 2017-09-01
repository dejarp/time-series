import * as Rx from 'rxjs';
import TimeSeries from './time-series';
import TimeSeriesPoint from './time-series-point';

export default function CarryForward<T>(timeSeries: TimeSeries<T>, cycles: Rx.Observable<Date>) : TimeSeries<T> {
    return Rx.Observable
        .combineLatest(cycles, timeSeries)
        .map((combination: [Date, TimeSeriesPoint<T>]) => ({
            d: combination[0],
            v: combination[1].v
        }));
}
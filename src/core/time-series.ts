import * as Rx from 'rxjs';
import TimeSeriesPoint from './time-series-point';

type TimeSeries<T> = Rx.Observable<TimeSeriesPoint<T>>;

export default TimeSeries;
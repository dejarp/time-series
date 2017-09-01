import * as Rx from 'rxjs';
import {TimeSeriesPoint} from './time-series-point';

export type TimeSeries<T> = Rx.Observable<TimeSeriesPoint<T>>;
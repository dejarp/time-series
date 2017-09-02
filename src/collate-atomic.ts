import * as _ from 'lodash';
import * as Rx from 'rxjs';
import TimeSeries from './core/time-series';
import TimeSeriesPoint from './core/time-series-point';

export default function CollateAtomic(timeSeries: TimeSeries<any>[], resultSelector: (...inputs: TimeSeriesPoint<any>[]) => TimeSeriesPoint<any>) : TimeSeries<any> {
    return Rx.Observable.zip(timeSeries, resultSelector);
}
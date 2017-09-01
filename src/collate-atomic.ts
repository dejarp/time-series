import * as _ from 'lodash';
import * as Rx from 'rxjs';
import {TimeSeries} from './time-series';
import {TimeSeriesPoint} from './time-series-point';

export function CollateAtomic(timeSeries: TimeSeries<any>[], resultSelector: (...inputs: TimeSeriesPoint<any>[]) => TimeSeriesPoint<any>) : TimeSeries<any> {
    return Rx.Observable.zip(timeSeries, resultSelector);
}
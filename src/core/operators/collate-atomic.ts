import * as _ from 'lodash';
import * as Rx from 'rxjs';
import TimeSeries from '../time-series';
import TimeSeriesPoint from '../time-series-point';

export default function CollateAtomic(timeSeries: TimeSeries<any>[], resultSelector: (...inputs: TimeSeriesPoint<any>[]) => TimeSeriesPoint<any>) : TimeSeries<any> {
    let zipArguments : any[] = timeSeries;
    zipArguments.push(resultSelector);
    return _.spread(Rx.Observable.zip)(zipArguments)
        .do(results => {
            if(_(results).map('d').uniq().value().length !== 1) {
                throw new Error('CollateAtomic only accepts aligned data');
            }
        });
}
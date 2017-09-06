import * as _ from 'lodash';
import * as Rx from 'rxjs';
import TimeSeries from '../time-series';
import TimeSeriesPoint from '../time-series-point';

export default function Order(...timeSeries: TimeSeries<any>[]) : TimeSeries<any> {
    return _.spread(Rx.Observable.merge)(timeSeries)
        .scan((accumulator, timeSeriesPoint: TimeSeriesPoint<any>) => {
            if(accumulator.currentDate === null || accumulator.currentDate.getTime <= timeSeriesPoint.d.getTime()) {
                accumulator.currentDate = timeSeriesPoint.d;
                accumulator.orderedTimeSeriesSubject.next(timeSeriesPoint);
            } else {
                // do nothing, because the point is out of order
            }
            return accumulator;
        }, {
            currentDate: null,
            orderedTimeSeriesSubject: new Rx.Subject()
        })
        .flatMap(accumulator => accumulator.orderedTimeSeriesSubject);
}
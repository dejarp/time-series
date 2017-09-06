import * as _ from 'lodash';
import * as Rx from 'rxjs';
import TimeSeries from '../time-series';
import TimeSeriesPoint from '../time-series-point';
import CollateBy from './collate-by';
import Tag from './tag';

export default function Toggle(timeSeries1: TimeSeries<any>, timeSeries2: TimeSeries<any>) : Rx.Observable<Rx.Subject<any>> {
    return Rx.Observable.merge(
        Tag(timeSeries1, 'timeSeries1'), 
        Tag(timeSeries2, 'timeSeries2'))
        .scan((accumulator: {changed: boolean, groupLabel: string, groupSubject: Rx.ReplaySubject<TimeSeriesPoint<any>>}, taggedPoint) => {
            accumulator.changed = false;
            if(accumulator.groupLabel !== taggedPoint.v.label) {
                accumulator.changed = true;
                accumulator.groupSubject.complete();
                accumulator.groupSubject = new Rx.ReplaySubject();
                accumulator.groupLabel = taggedPoint.v.label;
            }
            accumulator.groupSubject.next(taggedPoint);
            return accumulator;
        }, {
            changed: false,
            groupLabel: null,
            groupSubject: new Rx.ReplaySubject()
        })
        .filter(accumulator => accumulator.changed)
        .filter(accumulator => accumulator.groupLabel === 'timeSeries1')
        .map(accumulator => accumulator.groupSubject)
        .do(subject => {
            console.log('subject');
        });
}
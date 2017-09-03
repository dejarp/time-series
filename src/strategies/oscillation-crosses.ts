import * as Rx from 'rxjs';
import TimeSeries from '../core/time-series';
import Tag from '../core/operators/tag';
import Untag from '../core/operators/untag';

export default function OscillationCrosses<T>(highTimeSeries: TimeSeries<T>, lowTimeSeries: TimeSeries<T>) : TimeSeries<T> {
    return Untag(
        Rx.Observable.merge(
            Tag(highTimeSeries, 'high'),
            Tag(lowTimeSeries, 'low')
        )
        .distinctUntilChanged((point1, point2) => point1.v.label === point2.v.label)
    );
}
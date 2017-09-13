import * as _ from 'lodash';
import TimeSeries from '../time-series';
import CollateAtomic from './collate-atomic';

export default function Or(...timeSeries: TimeSeries<boolean>[]) : TimeSeries<boolean> {
    return CollateAtomic(timeSeries, function() {
        return {
            d: arguments[0].d,
            v: _.some(arguments, point => point.v)
        };
    });
}
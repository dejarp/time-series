import * as _ from 'lodash';
import TimeSeries from '../time-series';
import TimeSeriesPoint from '../time-series-point';

const MAX_DATE = new Date(8640000000000000);
const MIN_DATE = new Date(-8640000000000000)

export default function DateRange<T>(timeSeries: TimeSeries<T>, startDate: Date, endDate: Date) : TimeSeries<T> {
    const coercedStartDate = _.isDate(startDate) ? startDate : MIN_DATE;
    const coercedEndDate = _.isDate(endDate) ? endDate : MAX_DATE;

    if(coercedStartDate.getTime() > coercedEndDate.getTime()) {
        throw new Error('start date must be at or before end date');
    }

    return timeSeries.filter(function (point: TimeSeriesPoint<T>) {
        return point.d.getTime() >= coercedStartDate.getTime() && 
        point.d.getTime() <= coercedEndDate.getTime();
    })
}
import * as _ from 'lodash';
import * as Rx from 'rxjs';
import TimeSeries from '../time-series';
import TimeSeriesPoint from '../time-series-point';

export default function Collate(timeSeries: {[key: string]: TimeSeries<any>}) : TimeSeries<{[key: string]: TimeSeriesPoint<any>}> {
    var wrappedTimeSeries = _.map(timeSeries, (timeSeries, timeSeriesName) => {
        return timeSeries
            .map(point => ({
                name: timeSeriesName,
                point: point
            }));
    });

    var timeSeriesNames = _.keys(wrappedTimeSeries);

    return _.spread(Rx.Observable.merge)(_.values(wrappedTimeSeries))
        .scan((accumulator, wrappedPoint) => {
            accumulator.frameToEmit = null;
            var index = _.sortedIndexBy(accumulator.bins, {date: wrappedPoint.point.d}, bin => bin.date);
            if(!accumulator.bins[index]) {
                if(accumulator.currentDate === null 
                    || accumulator.currentDate < wrappedPoint.point.d) {
                    accumulator.bins[index] = {
                        date: wrappedPoint.point.d,
                        frame: {}
                    };   
                } else {
                    // do nothing, the date on the new point is less than the current date
                }
            } else {
                // do nothing, no need to add bin which already exists
            }
            accumulator.bins[index].frame[wrappedPoint.name] = wrappedPoint.point;

            // if the bin just touch is full emit it
            var isBinFull = _.every(timeSeriesNames, (timeSeriesName) => _.has(accumulator.bins[index].frame, timeSeriesName));
            if(isBinFull) {
                accumulator.frameToEmit = accumulator.bins[index].frame;
                accumulator.currentDate = accumulator.bins[index].date;
                accumulator.bins.splice(0, index);
            }

            return accumulator;
        }, {
            frameToEmit: null,
            currentDate: null,
            bins: []
        })
        .map(accumulator => accumulator.frameToEmit)
        .filter(frame => frame !== null)
};
import * as _ from 'lodash';
import * as Rx from 'rxjs';
import TimeSeries from '../time-series';

export default function AlignToDates<T>(timeSeries: TimeSeries<T>, dates: Rx.Observable<Date>) : TimeSeries<T>{
    return dates
        .merge(timeSeries)
        .scan((accumulator, dateOrPoint) => {
            accumulator.pointsToEmit = [];
            var index;
            if(_.isDate(dateOrPoint)) {
                var date = dateOrPoint;
                index = _.sortedIndexBy(accumulator.bins, { date: date }, bin => bin.date);
                if(!accumulator.bins[index]) {
                    // the array is empty, go ahead and insert
                    accumulator.bins.push({
                        date: date,
                        inDomain: true,
                        points: []
                    });
                } else {
                    // the bin exists, we either need to modify it or insert after it
                    if(accumulator.bins[index].date.getTime() === date.getTime()) {
                        accumulator.bins[index].inDomain = true
                    } else {
                        accumulator.bins.splice(index, 0, {
                            date: date,
                            inDomain: true,
                            points: []
                        });
                    }
                }
            } else {
                var point = dateOrPoint;
                if(accumulator.currentDate && accumulator.currentDate.getTime() === point.d.getTime()) {
                    accumulator.pointsToEmit = [ point ];
                } else {
                    index = _.sortedIndexBy(accumulator.bins, { date: point.d }, bin => bin.date);
                    if(!accumulator.bins[index]) {
                        accumulator.bins.push({
                            date: point.d,
                            inDomain: false,
                            points: [ point ]
                        });
                    } else {
                        if(accumulator.bins[index].date.getTime() === point.d.getTime()) {
                            accumulator.bins[index].points.push(point);
                        } else {
                            accumulator.bins.splice(index, 0, {
                                date: point.d,
                                inDomain: false,
                                points: [ point ]
                            });
                        }
                    }
                }
            }

            // at this point the date or point should have been added
            // need to see if that bin is full (has a date and point(s))
            // if it is full, 
            if( accumulator.bins[index]
                && accumulator.bins[index].inDomain 
                && !_.isEmpty(accumulator.bins[index].points)
            ) {
                accumulator.currentDate = accumulator.bins[index].date;
                accumulator.pointsToEmit = accumulator.bins[index].points;
                accumulator.bins.splice(0, index + 1);
            }

            return accumulator;
        }, {
            currentDate: null,
            pointsToEmit: [],
            bins: []
        })
        .flatMap(accumulator => accumulator.pointsToEmit);
}
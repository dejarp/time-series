import * as _ from 'lodash';
import * as Rx from 'rxjs';
import TimeSeries from '../time-series';
import TimeSeriesPoint from '../time-series-point';

export default function(timeSeries: TimeSeries<any>[], resultSelector?: (...results: TimeSeriesPoint<any>[]) => TimeSeriesPoint<any>) : TimeSeries<any> {
    let taggedTimeSeries: TimeSeries<{index: number, value: any}>[] = _.map(timeSeries, (series, index) => series.map(point => ({
        d: point.d,
        v: {
            index: index,
            value: point
        }
    })));
    
    return _.spread(Rx.Observable.merge)(taggedTimeSeries)
        .scan((buffer: TimeSeriesPoint<any>[], point: TimeSeriesPoint<{index: number, value: any}>) => {
            let pointIndex = _.sortedIndexBy(buffer, point, p => p.d);
            if(!buffer[pointIndex] || buffer[pointIndex].d.getTime() !== point.d.getTime()) {
                buffer.splice(pointIndex, 0, {
                    d: point.d,
                    v: _.fill(new Array(taggedTimeSeries.length), null)
                });
            }
            buffer[pointIndex].v[point.v.index] = point.v.value;
            let isBinFull = _.every(buffer[pointIndex].v, bin => !_.isNull(bin))
            if(isBinFull) {
                buffer.splice(0, pointIndex);
            }
            return buffer;
        }, [])
        .map(buffer => buffer[0])
        .filter((point: TimeSeriesPoint<any>) => _.every(point.v, value => value !== null))
        .map(fullBin => {
            return _.isFunction(resultSelector) ? resultSelector.apply(null, fullBin.v) : fullBin;
        });
}
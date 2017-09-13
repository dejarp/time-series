import * as _ from 'lodash';
import * as Rx from 'rxjs';
import TimeSeries from '../time-series';
import TimeSeriesPoint from '../time-series-point';
import CollateAtomic from './collate-atomic';
import CarryForward from './carry-forward';
import Tag from './tag';
import {TimeSeriesTag} from './tag';
import MovingWindow from './moving-window';

let logicalXor = (value1, value2) => (value1 && !value2) || (!value1 && value2);

export default function Cluster(timeSeries1: TimeSeries<boolean>, timeSeries2: TimeSeries<boolean>) : TimeSeries<boolean> {
    return CollateAtomic([
        Tag(timeSeries1, 'A'), 
        Tag(timeSeries2, 'B')],
        (point1: TimeSeriesPoint<TimeSeriesTag<boolean>>, point2: TimeSeriesPoint<TimeSeriesTag<boolean>>) => {
            return {
                d: point1.d,
                v: {
                    A: point1,
                    B: point2
                }
            };
        })
        .scan((accumulator, point: TimeSeriesPoint<{[key: string]: TimeSeriesPoint<any>}>) => {
            // TODO: OMG clean this up
            let xor = logicalXor(point.v['A'].v.value, point.v['B'].v.value);
            let label = xor ? (point.v['A'].v.value ? 'A' : 'B') : '';
            let firstLabelInGroup = label === '' || accumulator.lastLabel === label ? '' : label;
            accumulator.point = {
                d: point.d,
                v: firstLabelInGroup === 'A'
            };
            accumulator.lastLabel = accumulator.lastLabel === label || label === '' ? accumulator.lastLabel : label;
            return accumulator;
        }, {
            lastLabel: null,
            point: null
        })
        .map(accumulator => accumulator.point);
}
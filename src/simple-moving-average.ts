import * as _ from 'lodash';
import MovingWindow from './moving-window';

function mean(points) {
    return _(points).map('v').sum() / points.length;
}

export default function SimpleMovingAverage(timeSeries, periods) {
    return MovingWindow(timeSeries, periods)
        .map(points => ({
            d: _.last(points).d,
            v: mean(points)
        }))
        //.do(point => console.log(`SMA: Date: ${point.d}, Value: ${point.v}`))
        ;
}
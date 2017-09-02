import * as _ from 'lodash';
import MovingWindow from './moving-window';
import TimeSeries from './core/time-series';

function mean(points) : number {
    return _(points).map('v').sum() / points.length;
}

export default function SimpleMovingAverage(timeSeries: TimeSeries<number>, periods: number) : TimeSeries<number> {
    return MovingWindow(timeSeries, periods)
        .map(window => ({
            d: window.d,
            v: mean(window.v)
        }));
}
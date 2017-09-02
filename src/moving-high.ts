import * as _ from 'lodash';
import MovingWindow from './moving-window';
import TimeSeries from './time-series';

export default function MovingHigh<T>(timeSeries: TimeSeries<T>, periods: number) : TimeSeries<T> {
    return MovingWindow(timeSeries, periods)
        .map(window => {
            return {
                d: window.d,
                v: _.maxBy(window.v, point => point.v).v
            };
        });
}
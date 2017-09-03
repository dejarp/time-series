import * as _ from 'lodash';
import MovingWindow from './moving-window';
import TimeSeries from '../time-series';
import TimeSeriesPoint from '../time-series-point';

export default function MovingLow<T>(timeSeries: TimeSeries<T>, periods: number) : TimeSeries<T> {
    return MovingWindow(timeSeries, periods)
        .map((window : TimeSeriesPoint<TimeSeriesPoint<T>[]>) => ({
            d: window.d,
            v: _.minBy(window.v, point => point.v).v
        }));
};
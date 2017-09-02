import * as _ from 'lodash';
import TimeSeries from './time-series';
import TimeSeriesPoint from './time-series-point';

export default function MovingWindow<T>(timeSeries: TimeSeries<T>, periods: number) : TimeSeries<TimeSeriesPoint<T>[]> {
    return timeSeries
        .scan((window: TimeSeriesPoint<T>[], point: TimeSeriesPoint<T>) => {
            if(_.isEmpty(window)) {
                window.push(point);
            } else {
                if(window[window.length-1].d.getTime() === point.d.getTime()) {
                    window[window.length-1] = point;
                } else {
                    return _(window).takeRight(periods-1).push(point).value();
                }
            }
            return window;
        }, [])
        .filter(window => window.length === periods)
        .map(window => ({
            d: _.last(window).d,
            v: window
        }))
};
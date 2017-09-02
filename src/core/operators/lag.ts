import MovingWindow from './moving-window';
import TimeSeries from '../time-series';

export default function Lag<T>(timeSeries: TimeSeries<T>, periods) : TimeSeries<T> {
    return MovingWindow(timeSeries, periods + 1)
        .map(window => ({
            d: window.d,
            v: window.v[0].v
        }))
};
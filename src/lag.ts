import { MovingWindow } from './moving-window';

export function Lag(timeSeries, periods) {
    return MovingWindow(timeSeries, periods + 1)
        .map(window => ({
            d: window[window.length-1].d,
            v: window[0].v
        }))
};
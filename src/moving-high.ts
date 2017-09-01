import * as _ from 'lodash';
import { MovingWindow } from './moving-window';

export function MovingHigh(timeSeries, periods) {
    return MovingWindow(timeSeries, periods)
        .map(window => {
            return {
                d: _.last(window).d,
                v: _.maxBy(window, point => point.v).v
            };
        });
}
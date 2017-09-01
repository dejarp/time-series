import * as _ from 'lodash';
import MovingWindow from './moving-window';

export default function MovingLow(timeSeries, periods) {
    return MovingWindow(timeSeries, periods)
        .map(window => ({
            d: _.last(window).d,
            v: _.minBy(window, point => point.v).v
        }));
};
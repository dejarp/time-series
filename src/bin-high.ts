import * as _ from 'lodash';
import { BinWindow } from './bin-window';

export function BinHigh(timeSeries) {
    return BinWindow(timeSeries)
        .map(point => ({
            d: point.d,
            v: _.max(point.v)
        }));
};
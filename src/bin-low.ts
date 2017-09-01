import * as _ from 'lodash';
import { BinWindow } from './bin-window';

export function BinLow(timeSeries) {
    return BinWindow(timeSeries)
        .map(point => ({
            d: point.d,
            v: _.min(point.v)
        }));
};
import * as _ from 'lodash';
import BinWindow from './bin-window';
import TimeSeries from '../time-series';
import TimeSeriesPoint from '../time-series-point';

export default function BinLow<T>(timeSeries: TimeSeries<T>) : TimeSeries<T>{
    return BinWindow(timeSeries)
        .map(point => ({
            d: point.d,
            v: _.min(point.v)
        }));
};
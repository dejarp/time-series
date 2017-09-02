import Subtract from '../core/operators/subtract';
import MultiplyBy from '../core/operators/multiply-by';
import SimpleMovingAverage from './simple-moving-average';
import StandardDeviation from '../core/operators/standard-deviation';
import TimeSeries from '../core/time-series.js';

export default function BollingerBandLower(timeSeries: TimeSeries<number>, periods: number, multiplier: number) {
    return Subtract(
        SimpleMovingAverage(timeSeries, periods),
        MultiplyBy(
            StandardDeviation(timeSeries, periods), multiplier
        )
    )
};
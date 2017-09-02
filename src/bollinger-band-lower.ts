import Subtract from './subtract';
import MultiplyBy from './multiply-by';
import SimpleMovingAverage from './simple-moving-average';
import StandardDeviation from './standard-deviation';
import TimeSeries from './core/time-series.js';

export default function BollingerBandLower(timeSeries: TimeSeries<number>, periods: number, multiplier: number) {
    return Subtract(
        SimpleMovingAverage(timeSeries, periods),
        MultiplyBy(
            StandardDeviation(timeSeries, periods), multiplier
        )
    )
};
import { Subtract } from './subtract';
import { MultiplyBy } from './multiply-by';
import { SimpleMovingAverage } from './simple-moving-average';
import { StandardDeviation } from './standard-deviation';

export function BollingerBandLower(timeSeries, periods, multiplier) {
    return Subtract(
        SimpleMovingAverage(timeSeries, periods),
        MultiplyBy(
            StandardDeviation(timeSeries, periods), multiplier
        )
    )
};
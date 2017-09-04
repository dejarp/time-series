import CollateAtomic from '../core/operators/collate-atomic';
import MovingLow from '../core/operators/moving-low';
import MovingHigh from '../core/operators/moving-high';
import Lag from '../core/operators/lag';
import TimeSeriesPoint from '../core/time-series-point';

export default function StochasticK(closeSeries, highSeries, lowSeries, periods) {
    return CollateAtomic([
        closeSeries.skip(periods - 1),
        MovingLow(lowSeries, periods),
        MovingHigh(highSeries, periods)],
        (close, lowestLow, highestHigh) => ({
            d: close.d,
            v: 100 * (close.v - lowestLow.v) / (highestHigh.v - lowestLow.v)
        })
    )
}
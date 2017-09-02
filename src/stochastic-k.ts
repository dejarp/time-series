import CollateAtomic from './collate-atomic';
import MovingLow from './moving-low';
import MovingHigh from './moving-high';
import Lag from './lag';
import TimeSeriesPoint from './core/time-series-point';

export default function StochasticK(closeSeries, highSeries, lowSeries, periods) {
    return CollateAtomic([
        closeSeries.skip(periods - 1),
        MovingLow(lowSeries, periods),
        MovingHigh(highSeries, periods)],
        (close, lowestLow, highestHigh) => {
            if(close.d.getTime() !== lowestLow.d.getTime()) {
                throw new Error('misaligned');
            }
            return {
                d: close.d,
                v: 100 * (close.v - lowestLow.v) / (highestHigh.v - lowestLow.v)
            };
        }
    )
}
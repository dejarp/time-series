import SimpleMovingAverage from './simple-moving-average';
import StochasticK from './stochastic-k';

export default function StochasticD(closeSeries, highSeries, lowSeries, periods, smoothingPeriods) {
    return SimpleMovingAverage(
        StochasticK(closeSeries, highSeries, lowSeries, periods), 
        smoothingPeriods
    );
}
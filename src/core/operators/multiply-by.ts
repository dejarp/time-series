import TimeSeries from '../time-series';

export default function MultiplyBy(timeSeries: TimeSeries<number>, multiplier: number) {
    return timeSeries
        .map(point => ({
           d: point.d,
           v: point.v * multiplier
        }));
};
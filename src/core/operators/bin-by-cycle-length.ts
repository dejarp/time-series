import TimeSeries from '../time-series';

export default function BinByCycleLength<T>(timeSeries: TimeSeries<T>, cycleLength: number) : TimeSeries<T> {
    return timeSeries.map(point => ({
        d: new Date(Math.floor(point.d.getTime() / cycleLength) * cycleLength),
        v: point.v
    }));
}
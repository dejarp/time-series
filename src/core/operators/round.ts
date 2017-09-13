import TimeSeries from '../time-series';
import TimeSeriesPoint from '../time-series-point';

export default function Round(timeSeries: TimeSeries<number>, decimalPlaces: number) : TimeSeries<number> {
    return timeSeries
        .map((point: TimeSeriesPoint<number>) => ({
            d: point.d,
            v: +point.v.toFixed(decimalPlaces)
        }))
}
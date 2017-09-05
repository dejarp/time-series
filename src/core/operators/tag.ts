import TimeSeries from '../time-series';

export type TimeSeriesTag<T> = {
    label: string,
    value: T
};

export default function Tag<T>(timeSeries: TimeSeries<T>, label: string) : TimeSeries<TimeSeriesTag<T>> {
    return timeSeries
        .map(point => ({
            d: point.d,
            v: {
                label: label,
                value: point.v
            }
        }));
}
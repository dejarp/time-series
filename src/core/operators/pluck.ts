import TimeSeries from '../../core/time-series';

export default function PluckData(timeSeries: TimeSeries<{[key: string]: any}>, field: string): TimeSeries<any> {
    return timeSeries.map(candle => ({ 
        d: candle.d, 
        v: candle.v[field] 
    }));
};
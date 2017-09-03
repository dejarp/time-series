import * as _ from 'lodash';
import * as Rx from 'rxjs';
import TimeSeries from '../core/time-series';
import TimeSeriesPoint from '../core/time-series-point';

export enum ThresholdCrossDirections {
    LowToHigh,
    HighToLow
};
export type ThresholdCross = {
    threshold: string,
    direction: ThresholdCrossDirections
};

export function ThresholdStrategy(timeSeries: TimeSeries<number>, thresholds: {[key: string]: number}) : TimeSeries<ThresholdCross> {
    let sortedThresholds = _(thresholds)
        .map((value: number, key: string) => ({
            name: key,
            value: value
        }))
        .sortBy(threshold => threshold.value)
        .value();

    let timeSeriesBuffer = timeSeries.bufferCount(2,1);
    
    let lowToHighCrosses : TimeSeries<ThresholdCross> = timeSeriesBuffer
        .flatMap((buffer: [TimeSeriesPoint<number>]) => _(sortedThresholds)
            .filter(threshold => buffer[0].v < threshold.value && buffer[1].v >= threshold.value)
            .map(threshold => ({
                d: buffer[1].d,
                v: {
                    threshold: threshold.name,
                    direction: ThresholdCrossDirections.LowToHigh
                }
            }))
            .value()
        );

    let highToLowCroses : TimeSeries<ThresholdCross> = timeSeriesBuffer
        .flatMap(buffer => _(sortedThresholds)
            .filter(threshold => buffer[0].v > threshold.value && buffer[1].v <= threshold.value)
            .map(threshold => ({
                d: buffer[1].d,
                v: {
                    threshold: threshold.name,
                    direction: ThresholdCrossDirections.HighToLow
                }
            }))
            .value()
        );
        
    return Rx.Observable.merge(lowToHighCrosses, highToLowCroses);
}
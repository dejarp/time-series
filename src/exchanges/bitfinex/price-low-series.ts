import * as Rx from 'rxjs';
import CandlesSelector from './candles-selector';
import PriceLowRealTime from './price-low-real-time';
import TimeSeries from '../../core/time-series';
import AlignToDates from '../../core/operators/align-to-dates';
import DateDomain from './date-domain';

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    let priceLowHistorical = CandlesSelector(bfxFrom, bfxTo, cycleLength, 'hist', 'low');
    let priceLowLast = CandlesSelector(bfxFrom, bfxTo, cycleLength, 'last', 'low');
    let priceLowRealTime = PriceLowRealTime(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength);
    return AlignToDates(
        Rx.Observable.concat(
            priceLowHistorical,
            priceLowLast,
            priceLowRealTime
        ),
        DateDomain(cycleLength)
    );
};

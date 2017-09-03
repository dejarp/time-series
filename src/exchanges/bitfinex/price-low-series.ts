import * as Rx from 'rxjs';
import PriceLowHistorical from './price-low-historical';
import PriceLowRealTime from './price-low-real-time';
import TimeSeries from '../../core/time-series';
import AlignToDates from '../../core/operators/align-to-dates';
import DateDomain from './date-domain';

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    let priceLowHistorical = PriceLowHistorical(bfxFrom, bfxTo, cycleLength);
    let priceLowRealTime = PriceLowRealTime(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength);
    return AlignToDates(
        Rx.Observable.concat(
            priceLowHistorical,
            priceLowRealTime
        ),
        DateDomain(cycleLength)
    );
};
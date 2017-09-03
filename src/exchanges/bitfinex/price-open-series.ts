import * as Rx from 'rxjs';
import PriceOpenHistorical from './price-open-historical';
import PriceOpenRealTime from './price-open-real-time';
import TimeSeries from '../../core/time-series';
import AlignToDates from '../../core/operators/align-to-dates';
import DateDomain from './date-domain';

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    let priceOpenHistorical = PriceOpenHistorical(bfxFrom, bfxTo, cycleLength);
    let priceOpenRealTime = PriceOpenRealTime(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength);
    return AlignToDates(
        Rx.Observable.concat(
            priceOpenHistorical,
            priceOpenRealTime
        ),
        DateDomain(cycleLength)
    );
};
import * as _ from 'lodash';
import * as Rx from 'rxjs';
import PriceCloseHistorical from './price-close-historical';
import PriceCloseRealTime from './price-close-real-time';
import TimeSeries from '../../core/time-series';
import AlignToDates from '../../core/operators/align-to-dates';
import DateDomain from './date-domain';

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    let priceCloseHistorical = PriceCloseHistorical(bfxFrom, bfxTo, cycleLength);
    let priceCloseRealTime = PriceCloseRealTime(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength)
    return AlignToDates(
        Rx.Observable.concat(
            priceCloseHistorical,
            priceCloseRealTime
        ),
        DateDomain(cycleLength)
    );
};
    
import * as Rx from 'rxjs';
import CandlesSelector from './candles-selector';
import PriceHighRealTime from './price-high-real-time';
import TimeSeries from '../../core/time-series';
import AlignToDates from '../../core/operators/align-to-dates';
import DateDomain from './date-domain'

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    let priceHighHistorical = CandlesSelector(bfxFrom, bfxTo, cycleLength, 'hist', 'high');
    let priceHighLast = CandlesSelector(bfxFrom, bfxTo, cycleLength, 'last', 'high');
    let priceHighRealTime = PriceHighRealTime(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength);
    return AlignToDates(
        Rx.Observable.concat(
            priceHighHistorical,
            priceHighLast,
            priceHighRealTime
        ),
        DateDomain(cycleLength)
    );
};
    
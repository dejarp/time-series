import * as Rx from 'rxjs';
import CandlesSelector from './candles-selector';
import TimeSeries from '../../core/time-series';
import AlignToDates from '../../core/operators/align-to-dates';
import RealTimeData from './real-time-data';
import BinHigh from '../../core/operators/bin-high';
import DateDomain from './date-domain'

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    let priceHighHistorical = CandlesSelector(bfxFrom, bfxTo, cycleLength, 'hist', 'high');
    let priceHighLast = CandlesSelector(bfxFrom, bfxTo, cycleLength, 'last', 'high');
    let priceHighRealTime = BinHigh(RealTimeData(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength));
    return AlignToDates(
        Rx.Observable.concat(
            priceHighHistorical,
            priceHighLast.delay(<any> priceHighRealTime),
            priceHighRealTime
        ),
        DateDomain(cycleLength)
    );
};
    
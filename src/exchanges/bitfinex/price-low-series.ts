import * as Rx from 'rxjs';
import CandlesSelector from './candles-selector';
import TimeSeries from '../../core/time-series';
import AlignToDates from '../../core/operators/align-to-dates';
import DateDomain from './date-domain';
import RealTimeData from './real-time-data';
import BinLow from '../../core/operators/bin-low';

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    let priceLowHistorical = CandlesSelector(bfxFrom, bfxTo, cycleLength, 'hist', 'low');
    let priceLowLast = CandlesSelector(bfxFrom, bfxTo, cycleLength, 'last', 'low');
    let priceLowRealTime = BinLow(RealTimeData(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength));
    return AlignToDates(
        Rx.Observable.concat(
            priceLowHistorical,
            priceLowLast,
            priceLowRealTime
        ),
        DateDomain(cycleLength)
    );
};

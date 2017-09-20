/// <reference path="../../type-supplements/rx.d.ts"/>

import * as Rx from 'rxjs';
import CandlesSelector from './candles-selector';
import TimeSeries from '../../core/time-series';
import AlignToDates from '../../core/operators/align-to-dates';
import DateDomain from './date-domain';
import RealTimeData from './real-time-data';
import BinOpen from '../../core/operators/bin-open';

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    let priceOpenHistorical = CandlesSelector(bfxFrom, bfxTo, cycleLength, 'hist', 'open');
    let priceOpenRealTime = BinOpen(RealTimeData(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength));
    let priceOpenLast = CandlesSelector(bfxFrom, bfxTo, cycleLength, 'last', 'open');
    return AlignToDates(
        Rx.Observable.concat(
            priceOpenHistorical,
            priceOpenLast.delay(<any> priceOpenRealTime),
            priceOpenRealTime
        ),
        DateDomain(cycleLength)
    );
};
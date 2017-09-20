import * as _ from 'lodash';
import * as Rx from 'rxjs';
import CandlesSelector from './candles-selector';
import TimeSeries from '../../core/time-series';
import AlignToDates from '../../core/operators/align-to-dates';
import DateDomain from './date-domain';
import RealTimeData from './real-time-data';
import BinClose from '../../core/operators/bin-close';

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    let priceCloseHistorical = CandlesSelector(bfxFrom, bfxTo, cycleLength, 'hist', 'close');
    let priceCloseLast = CandlesSelector(bfxFrom, bfxTo, cycleLength, 'last', 'close');
    let priceCloseRealTime = BinClose(RealTimeData(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength));
    return AlignToDates(
        Rx.Observable.concat(
            priceCloseHistorical,
            priceCloseLast,
            priceCloseRealTime
        ),
        DateDomain(cycleLength)
    );
};
    
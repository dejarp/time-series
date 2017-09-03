import * as _ from 'lodash';
import * as Rx from 'rxjs';
import PriceCloseHistorical from './price-close-historical';
import PriceCloseRealTime from './price-close-real-time';
import TimeSeries from '../../core/time-series';

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    let priceCloseHistorical = PriceCloseHistorical(bfxFrom, bfxTo, cycleLength);
    let priceCloseRealTime = PriceCloseRealTime(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength)
        .do(console.log)
    return Rx.Observable.concat(
        priceCloseHistorical.do(bla => {
            console.log('hist');
            console.log(bla);
        }),
        priceCloseRealTime.do(bla => {
            console.log('realtime');
            console.log(bla);
        }),
    );
};
    
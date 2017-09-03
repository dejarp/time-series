import PriceHighHistorical from './price-high-historical';
import PriceHighRealTime from './price-high-real-time';
import TimeSeries from '../../core/time-series';

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<number> {
    let priceHighHistorical = PriceHighHistorical(bfxFrom, bfxTo, cycleLength);
    let priceHighRealTime = PriceHighRealTime(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength);
    return priceHighHistorical.concat(priceHighRealTime);
};
    
import * as _ from 'lodash';
import * as BitfinexAPI from 'bitfinex-api-node';

let resolveCacheKey = (apiKey: string, apiSecret: string) => {
    return `${apiKey}${apiSecret}`;
};
export default _.memoize((apiKey: string, apiSecret: string) => new BitfinexAPI(apiKey, apiSecret, {
    version: 2,
    transform: true
}), resolveCacheKey);
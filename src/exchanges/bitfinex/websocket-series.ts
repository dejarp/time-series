import * as _ from 'lodash';
import * as Rx from 'rxjs';
import ApiInstance from './api-instance';
import TimeSeries from '../../core/time-series';
import TimeSeriesPoint from '../../core/time-series-point';
import BinByCycleLength from '../../core/operators/bin-by-cycle-length';

type WebsocketPacket = {
    channelId: string;
    type: string,
    payload: any
}

let getCacheKey = (apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) => {
    return `${apiKey}${apiSecret}${bfxFrom}${bfxTo}${cycleLength}`;
}

export default _.memoize(function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<WebsocketPacket> {
    return Rx.Observable.defer(() => {
        let bfxPairId = `${bfxFrom}${bfxTo}`;
        let websocketMessages = new Rx.Subject<any>();

        const bfxAPI = ApiInstance(apiKey, apiSecret);

        bfxAPI.ws.on('open', () => {
            bfxAPI.ws.subscribeTrades(bfxPairId);
            bfxAPI.ws.subscribeOrderBook(bfxPairId);
            bfxAPI.ws.auth();
        });

        bfxAPI.ws.on('auth', () => {

        });
    
        bfxAPI.ws.on('message', message => websocketMessages.next(message));

        bfxAPI.ws.on('error', error => {
            websocketMessages.error(error);
        });

        // TODO: normalize these kinds of events
        let objectMessages = websocketMessages
            .filter(_.isPlainObject)

        let arrayMessages = websocketMessages
            .filter(_.isArray)

        let tradeSnapshotMessages = arrayMessages
            .filter(message => message[1][0].length === 4)
            .map(message => ({
                d: new Date(),
                v: {
                    channelId: message[0],
                    // Note: ts isn't an actual message in the API but 'ts' would be the convention to
                    // name the trade snapshot if it were to exist. The heuristic of length 4 could
                    // easily break as well. This is pretty ugly.
                    type: 'ts',
                    payload: message[1]
                }
            }));

        let generalMessages = arrayMessages
            // if the second field of the message is a string, then in all likelyhood it is a general
            // purpose message
            .filter(message => _.isString(message[1]))
            .map(message => {
                return {
                    d: new Date(),
                    v: {
                        // The first field is always the channel id if the message is an array
                        channelId: message[0],
                        type: message[1],
                        // Note: not all general messages will have a payload (ex. 'hb'). No idea what the 'hb' message is for
                        payload: message[2]
                    }
                };
            });

        return Rx.Observable.merge(generalMessages, tradeSnapshotMessages);
    
            // if(_.isPlainObject(msg)) {
            //     if(msg.event === 'info') {
        
            //     } else if(msg.event === 'subscribed') {
            //         if(msg.channel === 'book') {
            //             bookChannelId = msg.chanId;
            //         }
            //     }
            // } else if(_.isArray(msg)) {
            //     if(msg[0] === bookChannelId) {
            //         if(_.isArray(msg[1]) && _.isArray(msg[1][0])) {
            //             var orderbookInitialStates = msg[1];
            //             _.forEach(orderbookInitialStates, (obis) => {
            //                 var price = obis[0];
            //                 var count = obis[1];
            //                 var amount: any = obis[2];
        
            //                 if(amount > 0) {
            //                     var index = _.sortedIndexBy(orderbook.bids, {price: price}, bid => bid.price);
            //                     orderbook.bids.splice(index, 0, {
            //                         price: price,
            //                         count: count,
            //                         amount: amount
            //                     });
            //                 } else if(amount < 0) {
            //                     var index = _.sortedIndexBy(orderbook.asks, {price: price}, ask => ask.price);
            //                     orderbook.asks.splice(index, 0, {
            //                         price: price,
            //                         count: count,
            //                         amount: amount
            //                     });
            //                 } else {
            //                     throw new Error('well that was unexpected');
            //                 }
            //             });
            //         } else if (_.isArray(msg[1])) {
            //             var orderbookUpdate = msg[1];
            //             var price = orderbookUpdate[0];
            //             var count = orderbookUpdate[1];
            //             var amount = orderbookUpdate[2];
        
            //             if(count > 0) {
            //                 if(amount > 0) {
            //                     var index = _.sortedIndexBy(orderbook.bids, {price: price}, bid => bid.price);
            //                     if(!orderbook.bids[index] || orderbook.bids[index].price !== price) {
            //                         orderbook.bids.splice(index, 0, {
            //                             price: price,
            //                             count: count,
            //                             amount: amount
            //                         });
            //                     } else {
            //                         orderbook.bids[index].amount = amount;
            //                         orderbook.bids[index].count = count;
            //                     }
            //                 } else if(amount < 0) {
            //                     var index = _.sortedIndexBy(orderbook.asks, {price: price}, ask => ask.price);
            //                     if(!orderbook.asks[index] || orderbook.asks[index].price !== price) {
            //                         orderbook.asks.splice(index, 0, {
            //                             price: price,
            //                             count: count,
            //                             amount: amount
            //                         });
            //                     } else {
            //                         orderbook.asks[index].amount = amount;
            //                         orderbook.asks[index].count = count;
            //                     }
            //                 }
            //             } else {
            //                 if(amount === 1) {
            //                     var index = _.sortedIndexBy(orderbook.bids, {price: price}, bid => bid.price);
            //                     orderbook.bids.splice(index,1);
            //                 } else if(amount === -1) {
            //                     var index = _.sortedIndexBy(orderbook.asks, {price: price}, ask => ask.price);
            //                     orderbook.asks.splice(index,1);
            //                 }
            //             }
            //         }
        
            //         orderbookDataSource.next({
            //             d: messageTimeStamp,
            //             v: _.cloneDeep(orderbook)}
            //         );
            //     } else {
            //         var messageMetadata = getMessageMetadata(messageType);
                    
            //         messageMetadata.handler(msg);
            //     }
            // }
    }).shareReplay()
}, getCacheKey);

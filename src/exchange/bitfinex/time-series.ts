import * as _ from 'lodash';
import * as Rx from 'rxjs';
import * as request from 'request';
import AlignToDates from '../../align-to-dates';
import * as BFX from 'bitfinex-api-node';
import BinHigh from '../../bin-high';
import BinLow from '../../bin-low';
import CarryForward from '../../carry-forward';
import TimeSeriesPoint from '../../time-series-point';

const API_KEY = 'g0iI9DsJmEuLnZDIHJFXsm1DaJpqvA4TDQZlOslyYjA'
const API_SECRET = 'ONXjRxvFdy7XgPIO6HBn2gQx2sjLb3YGdLRc60etZPc'

const url = 'https://api.bitfinex.com/v2';

var bfxTimeFrames = {
    '60000': '1m',
    '300000': '5m',
    '900000': '15m',
    '1800000': '30m',
    '3600000': '1h',
    '10800000': '3h',
    '21600000': '6h',
    '43200000': '12h',
    '86400000': '1D',
    '604800000': '7D',
    '1209600000': '14D'
    // 1M is also supported, but since the length is variable there can
    // be no direct translation.
}

export default function BfxTimeSeries(bfxFrom: string, bfxTo: string, cycleLength: number, loggingEnabled: boolean) {
    if(!_.has(bfxTimeFrames, cycleLength)) {
        throw new Error('cycle length not supported by exchange');
    }

    var bfxPairId = `${bfxFrom}${bfxTo}`;
    var bfxSymbol = `t${bfxPairId}`;

    const bfxAPI = new BFX(API_KEY, API_SECRET, {
        version: 2,
        transform: true
    });

    var twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - (24 * 7));
    var nearestCycleStartTime = Math.floor(twentyFourHoursAgo.getTime() / cycleLength) * cycleLength;
    twentyFourHoursAgo.setTime(nearestCycleStartTime);
    
    var now = new Date();
    var nextCycleTime = Math.ceil(now.getTime() / cycleLength) * cycleLength;
    
    var futureCycles = Rx.Observable
        .timer(new Date(nextCycleTime), cycleLength)
        .map(cyclesSinceTimerStarted => new Date(nextCycleTime + (cycleLength * cyclesSinceTimerStarted)));
    
    var pastCycleCount = Math.floor((now.getTime() - nearestCycleStartTime) / cycleLength);
    var pastCycles = Rx.Observable
        .range(1, pastCycleCount)
        .map(cycleNumber => new Date(cycleNumber * cycleLength + nearestCycleStartTime));
    
    var cycles = pastCycles.concat(futureCycles);
    
    var priceOpenSubject= new Rx.Subject();
    var priceCloseSubject = new Rx.Subject();
    var priceHighSubject = new Rx.Subject();
    var priceLowSubject= new Rx.Subject();
    var volumeSubject = new Rx.Subject();
    var walletSubject = new Rx.Subject();
    var activeOrdersSubject = new Rx.Subject();
    
    request.get( 
        `${url}/candles/trade:${bfxTimeFrames[cycleLength]}:${bfxSymbol}/hist`,
        (error, response, body) =>  {
            var candles = JSON.parse(body);
    
            _.forEachRight(candles, (candle) => {
                // [date, open, close, high, low, volume]
                var date = new Date(candle[0]);
                priceOpenSubject.next({
                    d: date,
                    v: candle[1]
                });
                priceCloseSubject.next({
                    d: date,
                    v: candle[2]
                });
                priceHighSubject.next({
                    d: date,
                    v: candle[3]
                });
                priceLowSubject.next({
                    d: date,
                    v: candle[4]
                });
                volumeSubject.next({
                    d: date,
                    v: candle[5]
                });
            });
    
            priceOpenSubject.complete();
            priceHighSubject.complete();
            priceLowSubject.complete();
            volumeSubject.complete();
        }
    );
    
    bfxAPI.ws.on('open', () => {
        bfxAPI.ws.subscribeTrades(bfxPairId);
        bfxAPI.ws.subscribeOrderBook('IOTBTC')
        bfxAPI.ws.auth();
    });

    bfxAPI.ws.on('auth', () => {
        console.log('authenticated');
    });

    bfxAPI.ws.on('trade', (pair, trades) => {
        // 'te' stands for trade execution
        if(_.first(trades) !== 'te') {
            return;
        }
        _(trades)
            .tail()
            .forEachRight((trade: any) => {
                var date = new Date(trade.MTS);
                var price = trade.PRICE;
                var streamPoint = {
                    d: date,
                    v: price
                };
                priceCloseSubject.next(streamPoint);
            });
    });

    var bookChannelId;
    var orderbook = {
        bids: [],
        asks: []
    };

    var orderbookDataSource: Rx.Subject<TimeSeriesPoint<any>> = new Rx.Subject();
    var ordersTimeSeries = new Rx.Subject();
    bfxAPI.ws.on('message', (msg) => {
        var messageTimeStamp = new Date();
        var channelId = msg[0];
        var messageType = msg[1];
        var payload = msg[2];

        var messages = {};

        function orderPacketToOrderObject(order) {
            return {
                id: order[0],
                gid: order[1],
                cid: order[2],
                symbol: order[3],
                created: new Date(order[4]),
                updated: new Date(order[5]),
                amount: order[6],
                amountOriginal: order[7],
                type: order[8],
                typePrevious: order[9],
                placeholder1: order[10],
                placeholder2: order[11],
                flags: order[12],
                status: order[13],
                placeholder3: order[14],
                placeholder4: order[15],
                price: order[16],
                priceAverage: order[17],
                priceTrailing: order[18],
                priceAuxiallaryLimit: order[19],
                placeholder5: order[20],
                placeholder6: order[21],
                placeholder7: order[22],
                notify: order[23],
                hidden: order[24],
                placedId: order[25]
            };
        }

        var activeOrders = {};

        messages = {
            // order stream
            // https://docs.bitfinex.com/v2/reference#ws-auth-orders
            'os': {
                name: 'Order Snapshot',
                debug: true,
                handler: messageHandler(msg => {
                    var orders = msg[2];
                    console.log(orders);
                    _.each(orders, order => {
                        var orderObj = orderPacketToOrderObject(order); 
                        _.set(activeOrders, orderObj.id, orderObj);
                    });
                    activeOrdersSubject.next({
                        d: new Date(),
                        v: activeOrders
                    });
                })
            },
            'on': {
                name: 'Order New',
                debug: true,
                handler: messageHandler(msg => {
                    var order = msg[2];

                    var orderObj = orderPacketToOrderObject(order); 
                    _.set(activeOrders, orderObj.id, orderObj);
                    activeOrdersSubject.next({
                        d: new Date(),
                        v: activeOrders
                    });
                })
            },
            'ou': {
                name: 'Order Update',
                debug: true,
                handler: messageHandler(msg => {
                    var order = msg[2];
                    var orderObj = orderPacketToOrderObject(order); 
                    _.set(activeOrders, orderObj.id, orderObj);
                    activeOrdersSubject.next({
                        d: new Date(),
                        v: activeOrders
                    });
                })
            },
            'oc': {
                name: 'Order Cancel',
                debug: true,
                handler: messageHandler(msg => {
                    var order = msg[2];
                    var orderObj = orderPacketToOrderObject(order); 
                    delete activeOrders[orderObj.id];
                    activeOrdersSubject.next({
                        d: new Date(),
                        v: activeOrders
                    });
                })
            },
            // positions
            // https://docs.bitfinex.com/v2/reference#ws-auth-position
            'ps': {
                name: 'Position Snapshot',
                handler: messageHandler(msg => {
                })
            },
            'pn': {
                name: 'Position New',
                handler: messageHandler(msg => {
                })
            },
            'pu': {
                name: 'Position Update',
                handler: messageHandler(msg => {
                })
            },
            'pc': {
                name: 'Position Cancel',
                handler: messageHandler(msg => {
                })
            },
            // Trades
            // https://docs.bitfinex.com/v2/reference#ws-auth-trades
            'te': {
                name: 'Trade Execution',
                handler: messageHandler(msg => {
                })
            },
            'tu': {
                name: 'Trade Update',
                handler: messageHandler(msg => {
                })
            },
            // Funding Offers
            // https://docs.bitfinex.com/v2/reference#ws-auth-offers
            'fos': {
                name: 'Funding Offer Snapshot',
                handler: messageHandler(msg => {
                })
            },
            'fon': {
                name: 'Funding Offer New',
                handler: messageHandler(msg => {
                })
            },
            'fou': {
                name: 'Funding Offer Update',
                handler: messageHandler(msg => {
                })
            },
            'foc': {
                name: 'Funding Offer Cancel',
                handler: messageHandler(msg => {
                })
            },
            // Funding Credits
            // https://docs.bitfinex.com/v2/reference#ws-auth-credits
            'fcs': {
                name: 'Funding Credit Snapshot',
                handler: messageHandler(msg => {
                })
            },
            'fcn': {
                name: 'Funding Credit New',
                handler: messageHandler(msg => {
                })
            },
            'fcu': {
                name: 'Funding Credit Update',
                handler: messageHandler(msg => {
                })
            },
            'fcc': {
                name: 'Funding Credit Cancel',
                handler: messageHandler(msg => {
                })
            },
            // Funding Loans
            // https://docs.bitfinex.com/v2/reference#ws-auth-loans
            'fls': {
                name: 'Funding Loan Snapshot',
                handler: messageHandler(msg => {
                })
            },
            'fln': {
                name: 'Funding Loan New',
                handler: messageHandler(msg => {
                })
            },
            'flu': {
                name: 'Funding Loan Update',
                handler: messageHandler(msg => {
                })
            },
            'flc': {
                name: 'Funding Loan Cancel',
                handler: messageHandler(msg => {
                })
            },
            // Wallets
            // https://docs.bitfinex.com/v2/reference#ws-auth-wallets
            'ws': {
                name: 'Wallet Snapshot',
                debug: true,
                handler: messageHandler(msg => {
                    walletSubject.next(msg);
                })
            },
            'wu': {
                name: 'Wallet Update',
                handler: messageHandler(msg => {
                    walletSubject.next(msg);
                })
            },
            // Balance Info
            // https://docs.bitfinex.com/v2/reference#ws-auth-balance
            'bu': {
                name: 'Balance Info Update',
                debug: true,
                handler: messageHandler(msg => {
                })
            },
            // Margin Info
            // https://docs.bitfinex.com/v2/reference#ws-auth-margin
            'miu': {
                name: 'Margin Info Update',
                handler: messageHandler(msg => {
                })
            },
            // Funding Info
            // https://docs.bitfinex.com/v2/reference#ws-auth-funding
            'fiu': {
                name: 'Funding Info Update',
                handler: messageHandler(msg => {
                })
            },
            // Funding Trades
            // https://docs.bitfinex.com/v2/reference#ws-auth-funding-trades
            'fte': {
                name: 'Funding Trade Executed',
                handler: messageHandler(msg => {
                })
            },
            'ftu': {
                name: 'Funding Trade Update',
                handler: messageHandler(msg => {
                })
            },
            // Notifications
            // https://docs.bitfinex.com/v2/reference#ws-auth-notifications
            'n': {
                name: 'Notification',
                handler: messageHandler(msg => {
                })
            }
        };

        function getMessageMetadata(type) : any {
            return _.get(messages, type, { 
                name: 'Unknown', 
                handler: _.noop
            });
        }

        function messageHandler(cb) {
            return (msg) => {
                const messageType = msg[1];
                var messageMetadata = getMessageMetadata(messageType);
                if(loggingEnabled && messageMetadata.debug) {
                    console.log(`${messageMetadata.name}:`);
                    console.log(msg);
                }
                cb(msg);
            }
        }

        // console.log('Message: ');
        // console.log(msg);
        if(_.isPlainObject(msg)) {
            if(msg.event === 'info') {
    
            } else if(msg.event === 'subscribed') {
                if(msg.channel === 'book') {
                    bookChannelId = msg.chanId;
                }
            }
        } else if(_.isArray(msg)) {
            if(msg[0] === bookChannelId) {
                if(_.isArray(msg[1]) && _.isArray(msg[1][0])) {
                    var orderbookInitialStates = msg[1];
                    _.forEach(orderbookInitialStates, (obis) => {
                        var price = obis[0];
                        var count = obis[1];
                        var amount: any = obis[2];
    
                        if(amount > 0) {
                            var index = _.sortedIndexBy(orderbook.bids, {price: price}, bid => bid.price);
                            orderbook.bids.splice(index, 0, {
                                price: price,
                                count: count,
                                amount: amount
                            });
                        } else if(amount < 0) {
                            var index = _.sortedIndexBy(orderbook.asks, {price: price}, ask => ask.price);
                            orderbook.asks.splice(index, 0, {
                                price: price,
                                count: count,
                                amount: amount
                            });
                        } else {
                            throw new Error('well that was unexpected');
                        }
                    });
                } else if (_.isArray(msg[1])) {
                    var orderbookUpdate = msg[1];
                    //console.log(orderbookUpdate);
                    var price = orderbookUpdate[0];
                    var count = orderbookUpdate[1];
                    var amount = orderbookUpdate[2];
    
                    if(count > 0) {
                        if(amount > 0) {
                            var index = _.sortedIndexBy(orderbook.bids, {price: price}, bid => bid.price);
                            if(!orderbook.bids[index] || orderbook.bids[index].price !== price) {
                                orderbook.bids.splice(index, 0, {
                                    price: price,
                                    count: count,
                                    amount: amount
                                });
                            } else {
                                orderbook.bids[index].amount = amount;
                                orderbook.bids[index].count = count;
                            }
                        } else if(amount < 0) {
                            var index = _.sortedIndexBy(orderbook.asks, {price: price}, ask => ask.price);
                            if(!orderbook.asks[index] || orderbook.asks[index].price !== price) {
                                orderbook.asks.splice(index, 0, {
                                    price: price,
                                    count: count,
                                    amount: amount
                                });
                            } else {
                                orderbook.asks[index].amount = amount;
                                orderbook.asks[index].count = count;
                            }
                        }
                    } else {
                        if(amount === 1) {
                            var index = _.sortedIndexBy(orderbook.bids, {price: price}, bid => bid.price);
                            orderbook.bids.splice(index,1);
                        } else if(amount === -1) {
                            var index = _.sortedIndexBy(orderbook.asks, {price: price}, ask => ask.price);
                            orderbook.asks.splice(index,1);
                        }
                    }
                }
    
                orderbookDataSource.next({
                    d: messageTimeStamp,
                    v: _.cloneDeep(orderbook)}
                );
            } else {
                var messageMetadata = getMessageMetadata(messageType);
                
                messageMetadata.handler(msg);
            }
        }
    });

    var groupedOrderbookDataSource = orderbookDataSource
        .map(orderbook => {
            return {
                d: orderbook.d,
                v: {
                    bids: _(orderbook.v.bids)
                        .groupBy(bid => bid.price.toFixed(7))
                        .map(groupedBids => ({
                            price: parseFloat(groupedBids[0].price.toFixed(7)),
                            amount: _(groupedBids).map('amount').sum(),
                            count: _(groupedBids).map('count').sum()
                        }))
                        .value(),
                    asks: _(orderbook.v.asks)
                        .groupBy(ask => ask.price.toFixed(7))
                        .map(groupedAsks => ({
                            price: parseFloat(groupedAsks[0].price.toFixed(7)),
                            amount: _(groupedAsks).map('amount').sum(),
                            count: _(groupedAsks).map('count').sum()
                        }))
                        .value()
                }
            }
        });

    var balancesDataSource = walletSubject
        .map(walletMsg => ({
            d: new Date(),
            v: _.transform(walletMsg[2], (accumulator, balance) => {
                if(balance !== null) {
                    _.set(accumulator, balance[1], balance[2]);
                }
            }, {})
        }))
        .distinctUntilChanged(_.isEqual);

    var bidAskDataSource = groupedOrderbookDataSource
        .map(orderbook => ({
            d: orderbook.d,
            v: {
                bid: _.last(orderbook.v.bids),
                ask: _.first(orderbook.v.asks)
            }
        }))
        .distinctUntilChanged(_.isEqual)

    var bidsDataSource = bidAskDataSource
        .map(bidAsk => ({
            d: bidAsk.d,
            v: bidAsk.v.bid.price
        }));

    var asksDataSource = bidAskDataSource
        .map(bidAsk => ({
            d: bidAsk.d,
            v: bidAsk.v.ask.price
        }));

    bfxAPI.ws.on('error', console.error)

    var priceOpenDataSource = priceOpenSubject;
    var priceCloseDataSource = priceCloseSubject;
    var priceHighDataSource = priceHighSubject;
    var priceLowDataSource = priceLowSubject
    
    function BfxDataToTimeSeries(dataSource) {
        return dataSource.map(streamPoint => ({
            d: new Date(Math.floor(streamPoint.d.getTime() / cycleLength) * cycleLength),
            v: streamPoint.v
        }));
    }

    var priceOpenTimeSeries = AlignToDates(BfxDataToTimeSeries(priceOpenDataSource), cycles);
    var priceCloseTimeSeries = AlignToDates(BfxDataToTimeSeries(priceCloseDataSource), cycles);
    // Note: there is a bug here with concat and how it interacts with bitfinex api. The real time
    //       subscription will happen after the bin has been started most of the time, and since the
    //       historical fetch didn't fetch the current low or high, then the low or high as calculated
    //       here on the fly could be incorrect. To fix this, there needs to be a way to get the low and
    //       high of the current bin, or you can wait until the next bin to begin trading on more accurate data.
    var priceHighTimeSeries = AlignToDates(
        BfxDataToTimeSeries(priceHighDataSource).concat(BinHigh(priceCloseTimeSeries)), 
        cycles);
    var priceLowTimeSeries = AlignToDates(
        BfxDataToTimeSeries(priceLowDataSource).concat(BinLow(priceCloseTimeSeries)), 
        cycles);
    var bidsTimeSeries = AlignToDates(BfxDataToTimeSeries(bidsDataSource), cycles).distinctUntilChanged(_.isEqual);
    var asksTimeSeries = AlignToDates(BfxDataToTimeSeries(asksDataSource), cycles).distinctUntilChanged(_.isEqual);

    var balancesTimeSeries = AlignToDates(
        CarryForward(
            BfxDataToTimeSeries(balancesDataSource), 
            cycles
        ),
        cycles
    );

    var activeOrdersTimeSeries = AlignToDates(
        CarryForward(
            BfxDataToTimeSeries(activeOrdersSubject),
            cycles
        ),
        cycles
    );

    function placeLimitOrder(symbol, amount, price) {
        var cid = new Date().getTime();
        const order = [
            0,
            'on',
            null,
            {
                cid: cid,
                // EXCHANGE LIMIT is only different from LIMIT in which funds it is using
                type: 'EXCHANGE LIMIT',
                symbol: symbol,
                amount: amount.toString(),
                price: price.toString(),
                hidden: 0
            }
        ];
        
        bfxAPI.ws.submitOrder(order);
    }

    var orderSubject: Rx.Subject<any> = new Rx.Subject();
    orderSubject.subscribe(order => {
        placeLimitOrder(order.bfxSymbol, order.amount, order.price);
    });

    function cancelOrder(id) {
        // Note: the docs say that orders can be canceled using the cid and cid_date
        //       but I have found that to not be the case. It will always display the
        //       "order not found" message in bitfinex. I don't know if this happens
        //       due to misuse of the API or a bug on their end. Leaning towards latter.
        const orderCancel = [
            0,
            "oc",
            null,
            {
                "id": id
            }
        ];
    
        bfxAPI.ws.send(orderCancel);
    }

    var orderCancelAllSubject = new Rx.Subject();
    function cancelMultipleOrders(arrayOfOrderIds) {
        _.each(arrayOfOrderIds, orderId => {
            cancelOrder(orderId);
        });
    }

    orderCancelAllSubject.subscribe(orderIds => {
        cancelMultipleOrders(orderIds);
    });

    var orderCancelSubject: Rx.Subject<any> = new Rx.Subject();
    orderCancelSubject.subscribe(orderCancellation => {
        cancelOrder(orderCancellation.cid);
    });

    return {
        opens: priceOpenTimeSeries,
        closes: priceCloseTimeSeries,
        highs: priceHighTimeSeries,
        lows: priceLowTimeSeries,
        bids: bidsTimeSeries,
        asks: asksTimeSeries,
        balances: balancesTimeSeries,
        activeOrders: activeOrdersTimeSeries,
        orderSubject: orderSubject,
        orderCancelSubject: orderCancelSubject,
        orderCancelAllSubject: orderCancelAllSubject
    };
}
import * as _ from 'lodash';
import WebsocketWallets from './websocket-wallet-series';
import {BfxWallet, BfxWalletPacket, BfxWalletPacketTypes} from './websocket-wallet-series';
import TimeSeries from '../../core/time-series';
import TimeSeriesPoint from '../../core/time-series-point';
import DateDomain from './date-domain';
import BinByCycleLength  from '../../core/operators/bin-by-cycle-length';
import CarryForward from '../../core/operators/carry-forward';

export type BfxBalances = {
    [key: string]: {
        [key: string]: BfxWallet
    }
};

let WalletMap = (wallets: BfxWallet[], balances: BfxBalances) => _.transform(wallets, (accumulator, balance) => {
    _.set(accumulator, [balance.walletType, balance.currency], balance);
}, balances);

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<BfxBalances> {
    return CarryForward(
        BinByCycleLength(
            WebsocketWallets(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength)
                .scan((activeOrders, orderPacket: TimeSeriesPoint<BfxWalletPacket>) => {
                    let newActiveOrders;

                    if(orderPacket.v.type === BfxWalletPacketTypes.ws) {
                        newActiveOrders = WalletMap(orderPacket.v.wallets, {});
                    } else if(orderPacket.v.type === BfxWalletPacketTypes.wu) {
                        newActiveOrders = _.merge({}, activeOrders.v, WalletMap(orderPacket.v.wallets, {}));
                    } else {
                        console.error('hey, this should not happen ever.. investigate');
                    }

                    return {
                        d: orderPacket.d,
                        v: newActiveOrders
                    };
                }, {
                    d: new Date(),
                    v: {}
                }),
            cycleLength
        ),
        DateDomain(cycleLength)
    );
} 
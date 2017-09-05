import * as _ from 'lodash';
import * as Rx from 'rxjs';
import WebsocketSeries from './websocket-series';
import TimeSeries from '../../core/time-series';

type BfxWalletType = 'exchange'|'margin'|'funding';

export type BfxWallet = {
    walletType: BfxWalletType,
    currency: string,
    balance: number,
    unsettledInterest: number,
    /* These messages have gained the ability to send the calculation values (available balance) equal to "null" meaning that the new calculated value is not yet available.
       In order to receive those values the user have to actively request for it with a "calc" message.
       See calc input dedicated section for more details. */
    balanceAvailable: number|null
};

export enum BfxWalletPacketTypes {
    ws,
    wu
};

export type BfxWalletPacket = {
    type: BfxWalletPacketTypes,
    wallets: BfxWallet[]
};

let walletMessageStringsToTypesEnum = {
    'ws': BfxWalletPacketTypes.ws,
    'wu': BfxWalletPacketTypes.wu
};

function walletPacketToWalletObject(wallet) : BfxWallet {
    return {
        walletType: wallet[0],
        currency: wallet[1],
        balance: wallet[2],
        unsettledInterest: wallet[3],
        balanceAvailable: wallet[4]
    };
}

export default function(apiKey: string, apiSecret: string, bfxFrom: string, bfxTo: string, cycleLength: number) : TimeSeries<BfxWalletPacket> {
    // TODO: the implementation of these set of messages is almost exactly the same as
    //       for orders, and this is a pattern that will repeat, so consolodate this impl 
    //       into a separate file
    
    let walletMessages = WebsocketSeries(apiKey, apiSecret, bfxFrom, bfxTo, cycleLength)
        .filter(packet => _.has(walletMessageStringsToTypesEnum, packet.v.type))
    
    let walletSnapshotMessages = walletMessages
        .filter(packet => packet.v.type === 'ws')
        .map(packet => {
            return {
                d: new Date(),
                v: {
                    type: walletMessageStringsToTypesEnum[packet.v.type],
                    wallets: _.map(packet.v.payload, walletPacketToWalletObject)
                }
            }
        });

    let walletNewUpdateCancelMessages = walletMessages
        .filter(packet => packet.v.type !== 'ws')
        .map(packet => {
            return {
                d: new Date(),
                v: {
                    type: walletMessageStringsToTypesEnum[packet.v.type],
                    wallets: [ walletPacketToWalletObject(packet.v.payload)]
                }
            };
        });

    return Rx.Observable.merge(walletSnapshotMessages, walletNewUpdateCancelMessages);
}
const BFX = require('bitfinex-api-node');

// const API_KEY_V1 = '1mqGnxdFsLySYW53W4bgEwU38HfbFBKcNOvesYqmNMW';
// const API_SECRET_V1 = '3fvJhDb2LU86dES4nho27c3zyd400mb0FSVdJCAxrKF';

const API_KEY_V2 = 'g0iI9DsJmEuLnZDIHJFXsm1DaJpqvA4TDQZlOslyYjA';
const API_SECRET_V2 = 'ONXjRxvFdy7XgPIO6HBn2gQx2sjLb3YGdLRc60etZPc';

const opts = {
  version: 2,
  transform: true
};

// the version passed in earlier controls the version of the WebSockets API
// const restV1 = new BFX(API_KEY_V1, API_SECRET_V1, { version: 1, transform: true }).rest;
const bws = new BFX(API_KEY_V2, API_SECRET_V2, opts).ws;

bws.on('auth', () => {
    // emitted after .auth()
    // needed for private api endpoints

    console.log('authenticated')
    // bws.submitOrder ...

    var tot = new Date();
    var cid = tot.getTime();
    var yyyy = tot.getUTCFullYear();
    var mm = tot.getUTCMonth()+1 < 10 ? `0${tot.getUTCMonth()+1}`: `${tot.getUTCMonth()+1}`;
    var dd = tot.getUTCDay() < 10 ? `0${tot.getUTCDay()}` : `${tot.getUTCDay()}`;
    var cidYYYYMMDD = `${yyyy}-${mm}-${dd}`;
    
    const order = [
        0,
        "on",
        null,
        {
            "cid": cid,
            // EXCHANGE LIMIT is only different from LIMIT in which funds it is using
            "type": "EXCHANGE LIMIT",
            "symbol": "tIOTBTC",
            "amount": "-1",
            "price": ".00025",
            "hidden": 0
        }
    ];
    
    bws.submitOrder(order);
});

bws.on('message', (msg) => {
    var channelId = msg[0];
    var messageType = msg[1];
    var payload = msg[2];
    if(messageType === 'on') {
        console.log(msg);

        setTimeout(() => {
            var orderId = payload[0];
            
            const orderCancel = [
                0,
                "oc",
                null,
                {
                    "id": orderId
                }
            ];
    
            bws.send(orderCancel);
        }, 3000);
    }
});

bws.on('open', () => {
    console.log('opened');

    // authenticate
    bws.auth()
});

bws.on('error', console.error);

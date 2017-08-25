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

bws.on('error', console.error);

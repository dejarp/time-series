const BFX = require('bitfinex-api-node')

const API_KEY = 'g0iI9DsJmEuLnZDIHJFXsm1DaJpqvA4TDQZlOslyYjA'
const API_SECRET = 'ONXjRxvFdy7XgPIO6HBn2gQx2sjLb3YGdLRc60etZPc'

const opts = {
  version: 2,
  transform: true
}

const bws = new BFX(API_KEY, API_SECRET, opts).ws

bws.on('auth', () => {
  // emitted after .auth()
  // needed for private api endpoints

  console.log('authenticated')
  // bws.submitOrder ...
})

bws.on('open', () => {
  bws.subscribeTicker('IOTBTC')
  bws.subscribeOrderBook('IOTBTC')
  bws.subscribeTrades('IOTBTC')

  // authenticate
  // bws.auth()
})

bws.on('orderbook', (pair, book) => {
  //console.log('Order book:', book)
})

bws.on('trade', (pair, trade) => {
  console.log('Trade:', trade)
})

bws.on('ticker', (pair, ticker) => {
  //console.log('Ticker:', ticker)
})

bws.on('error', console.error)
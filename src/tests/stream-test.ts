import * as _ from 'lodash';
import * as Rx from 'rxjs';
import PriceCloseSeries from '../exchanges/bitfinex/price-close-series';
import PriceLowSeries from '../exchanges/bitfinex/price-low-series';
import PriceHighSeries from '../exchanges/bitfinex/price-high-series';
import CancelAllOrders from '../exchanges/bitfinex/cancel-all-orders';
import CreateBuyOrders from '../exchanges/bitfinex/create-buy-orders';
import CreateSellOrders from '../exchanges/bitfinex/create-sell-orders';

import HorizontalLine from '../indicators/horizontal-line';
import LowHighCrosses from '../strategies/low-high-crosses';
import HighLowCrosses from '../strategies/high-low-crosses';

import StochasticD from '../indicators/stochastic-d';
import StochasticK from '../indicators/stochastic-k';
import CollateBy from '../core/operators/collate-by';
import Periods from '../periods';

import MovingLow from '../core/operators/moving-low';
import MovingHigh from '../core/operators/moving-high';

const API_KEY = 'g0iI9DsJmEuLnZDIHJFXsm1DaJpqvA4TDQZlOslyYjA'
const API_SECRET = 'ONXjRxvFdy7XgPIO6HBn2gQx2sjLb3YGdLRc60etZPc'

let bfxFrom = 'IOT';
let bfxTo = 'BTC';
let bfxSymbol = `t${bfxFrom}${bfxTo}`;

let cycleLength = Periods.fiveMinutes;

// Set up data sources
let closeSeries = PriceCloseSeries(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength);
let lowSeries = PriceLowSeries(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength);
let highSeries = PriceHighSeries(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength);

// Apply inidicator(s) to input data
let stochasticDStream = StochasticD(closeSeries.do(bla => {
    console.log(bla);
}), highSeries, lowSeries, 14, 3)

// forumulate strategy (comprised of buy points, sell points, and hold points)
let buyLine = HorizontalLine(stochasticDStream, 16);
let sellLine = HorizontalLine(stochasticDStream, 84);

let buyPoints = HighLowCrosses(stochasticDStream, buyLine);
let sellPoints = LowHighCrosses(stochasticDStream, sellLine);
let holdPoints = Rx.Observable.merge(
    HighLowCrosses(stochasticDStream, buyLine),
    LowHighCrosses(stochasticDStream, sellLine)
);

// execute the strategy (create orders, and cancel orders as needed based on strategy)
let allocation = .1;
let cancelOrders = CancelAllOrders(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength, holdPoints);
let buyOrders = CreateBuyOrders(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength, closeSeries.do(bla => {
    console.log(bla);
}), allocation);
let sellOrders = CreateSellOrders(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength, closeSeries.do(bla => {
    console.log(bla);
}), allocation);

let marketActions = Rx.Observable.merge(buyOrders, /* sellOrders,cancelOrders*/);

marketActions.subscribe(point => console.log(JSON.stringify(point, null, '  ')));

// TODO: start trading
// TODO: start thinking about what the streams need to look like to make this support multiple exchanges
// TODO: factor in fees
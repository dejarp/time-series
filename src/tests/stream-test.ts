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

import Cluster from '../core/operators/cluster';
import TimeSeriesPoint from '../core/time-series-point';

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
let stochasticDStream = StochasticD(closeSeries, highSeries, lowSeries, 14, 3)
    .do(stoch => {
        //console.log(`Stoch D: ${stoch.v}`);
    })
let mockStochasticDStream = Rx.Observable.from([
    { d: new Date(2017,1,1,0,0,0,0),  v: 50 },
    { d: new Date(2017,1,1,0,5,0,0),  v: 0 },
    { d: new Date(2017,1,1,0,10,0,0), v: 21 },
    { d: new Date(2017,1,1,0,15,0,0), v: 0 },
    { d: new Date(2017,1,1,0,20,0,0), v: 21 },
    { d: new Date(2017,1,1,0,25,0,0), v: 0 },
    { d: new Date(2017,1,1,0,30,0,0), v: 50 },
    { d: new Date(2017,1,1,0,35,0,0), v: 100 },
    { d: new Date(2017,1,1,0,40,0,0), v: 79 },
    { d: new Date(2017,1,1,0,45,0,0), v: 100 },
    { d: new Date(2017,1,1,0,50,0,0), v: 79 },
    { d: new Date(2017,1,1,0,55,0,0), v: 100 },
    { d: new Date(2017,1,1,1,0,0,0), v: 50 },
    { d: new Date(2017,1,1,1,5,0,0), v: 0 },
    { d: new Date(2017,1,1,1,10,0,0), v: 21 },
    { d: new Date(2017,1,1,1,15,0,0), v: 0 },
    { d: new Date(2017,1,1,1,20,0,0), v: 50 },
    { d: new Date(2017,1,1,1,25,0,0), v: 100 },
    { d: new Date(2017,1,1,1,30,0,0), v: 50 }
]);
stochasticDStream = mockStochasticDStream;

// forumulate strategy (comprised of buy points, sell points, and hold points)
let buyLine = HorizontalLine(stochasticDStream, 16);
let sellLine = HorizontalLine(stochasticDStream, 84);

let buyPoints = HighLowCrosses(stochasticDStream, buyLine)
    .do(console.log);
let sellPoints = LowHighCrosses(stochasticDStream, sellLine)
    .do(console.log);
let holdPoints = Rx.Observable.merge(
    HighLowCrosses(stochasticDStream, sellLine),
    LowHighCrosses(stochasticDStream, buyLine))
    .do(point => {
        console.log(`Hold Point`);
        console.log(point);
    });

let buyPointsFiltered = Cluster(buyPoints, sellPoints)
    .map(buyPointCluster => buyPointCluster.first())
    .flatMap(firstInCluster => firstInCluster)
    // .do(point => {
    //     console.log(`Buy Point First`);
    //     console.log(point);
    // });

let sellPointsFiltered = Cluster(sellPoints, buyPoints)
    .flatMap(sellPointCluster => sellPointCluster.first())
    // .do(point => {
    //     console.log(`Sell Point First`);
    //     console.log(point);
    // });

let takeActionPoints = Rx.Observable.merge(buyPointsFiltered, sellPointsFiltered, holdPoints);
    
// execute the strategy (create orders, and cancel orders as needed based on strategy)
let allocation = .1;
let cancelOrders = CancelAllOrders(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength, holdPoints);
let buyOrders = CreateBuyOrders(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength, buyPointsFiltered, allocation);
let sellOrders = CreateSellOrders(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength, sellPointsFiltered, allocation);

let marketActions = Rx.Observable.merge(buyOrders, sellOrders, cancelOrders);

takeActionPoints.subscribe();

// TODO: start trading
// TODO: start thinking about what the streams need to look like to make this support multiple exchanges
// TODO: factor in fees
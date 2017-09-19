import * as _ from 'lodash';
import * as Rx from 'rxjs';
import PriceCloseSeries from '../exchanges/bitfinex/price-close-series';
import PriceLowSeries from '../exchanges/bitfinex/price-low-series';
import PriceHighSeries from '../exchanges/bitfinex/price-high-series';
import CancelAllOrders from '../exchanges/bitfinex/cancel-all-orders';
import CreateBuyOrders from '../exchanges/bitfinex/create-buy-orders';
import CreateSellOrders from '../exchanges/bitfinex/create-sell-orders';
import DateDomain from '../exchanges/bitfinex/date-domain';

import HorizontalLine from '../indicators/horizontal-line';
import LowHighCrosses from '../strategies/low-high-crosses';
import HighLowCrosses from '../strategies/high-low-crosses';

import StochasticD from '../indicators/stochastic-d';
import StochasticK from '../indicators/stochastic-k';
import CollateBy from '../core/operators/collate-by';
import Periods from '../periods';

import MovingLow from '../core/operators/moving-low';
import MovingHigh from '../core/operators/moving-high';

import Round from '../core/operators/round';
import Cluster from '../core/operators/cluster';
import TimeSeriesPoint from '../core/time-series-point';
import Or from '../core/operators/or';

import * as CliClear from 'cli-clear';
import AlignDate from '../core/align-date';
import DateRange from '../core/operators/date-range';
import ConsoleReport from '../core/console-report';

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

let stochasticKStream = StochasticK(closeSeries, highSeries, lowSeries, 14)
.distinctUntilChanged(_.isEqual)
.shareReplay();

// Apply inidicator(s) to input data
let stochasticDStream = StochasticD(closeSeries, highSeries, lowSeries, 14, 3)
    .distinctUntilChanged(_.isEqual)
    .shareReplay();

// let mockStochasticDStream = Rx.Observable.from([
//     { d: new Date(2017,1,1,0,0,0,0),  v: 50 },
//     { d: new Date(2017,1,1,0,5,0,0),  v: 0 },
//     { d: new Date(2017,1,1,0,5,0,0),  v: 0 },
//     { d: new Date(2017,1,1,0,5,0,0),  v: 0 },
//     { d: new Date(2017,1,1,0,10,0,0), v: 21 },
//     { d: new Date(2017,1,1,0,15,0,0), v: 0 },
//     { d: new Date(2017,1,1,0,20,0,0), v: 21 },
//     { d: new Date(2017,1,1,0,25,0,0), v: 0 },
//     { d: new Date(2017,1,1,0,30,0,0), v: 50 },
//     { d: new Date(2017,1,1,0,35,0,0), v: 100 },
//     { d: new Date(2017,1,1,0,40,0,0), v: 79 },
//     { d: new Date(2017,1,1,0,45,0,0), v: 100 },
//     { d: new Date(2017,1,1,0,50,0,0), v: 79 },
//     { d: new Date(2017,1,1,0,55,0,0), v: 100 },
//     { d: new Date(2017,1,1,1,0,0,0), v: 50 },
//     { d: new Date(2017,1,1,1,5,0,0), v: 0 },
//     { d: new Date(2017,1,1,1,10,0,0), v: 21 },
//     { d: new Date(2017,1,1,1,15,0,0), v: 0 },
//     { d: new Date(2017,1,1,1,20,0,0), v: 50 },
//     { d: new Date(2017,1,1,1,25,0,0), v: 100 },
//     { d: new Date(2017,1,1,1,30,0,0), v: 50 }
// ]);
// stochasticDStream = mockStochasticDStream;

// forumulate strategy (comprised of buy points, sell points, and hold points)
let highLine = HorizontalLine(stochasticDStream, 10);
let lowLine = HorizontalLine(stochasticDStream, 90);

//let decisionStream = 

let buyPoints = HighLowCrosses(stochasticDStream, highLine);
let sellPoints = LowHighCrosses(stochasticDStream, lowLine);
let holdPoints = Or(
    HighLowCrosses(stochasticDStream, lowLine),
    LowHighCrosses(stochasticDStream, lowLine)
);

// let buyPointsFiltered = Cluster(buyPoints, sellPoints);
// let sellPointsFiltered = Cluster(sellPoints, buyPoints);

// execute the strategy (create orders, and cancel orders as needed based on strategy)
let allocation = .1;
let cancelOrders = CancelAllOrders(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength, holdPoints);
let buyOrders = CreateBuyOrders(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength, buyPoints, allocation);
let sellOrders = CreateSellOrders(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength, sellPoints, allocation);

let marketActions = Rx.Observable.merge(buyOrders, sellOrders, cancelOrders);

//stochasticDStream.subscribe(console.log);

DateRange(
    ConsoleReport({
        'Close': Round(closeSeries, 8),
        'Low': Round(lowSeries, 8),
        'High': Round(highSeries, 8),
        //'Stochastic K': Round(stochasticKStream, 4),
        'Stochastic D': Round(stochasticDStream, 4),
        'Buy': buyPoints,
        'Sell': sellPoints,
        'hold': holdPoints,
        // 'BuyOrders': buyOrders,
        // 'SellOrders': sellOrders,
        // 'CancelOrders': cancelOrders
    }),
    AlignDate(new Date(), cycleLength),
    null
).subscribe(point => {
    CliClear();
    console.log(point.v.toString());
}, console.log);

// TODO: logging/tracing/debugging/reporting
// TODO: Clearn up
// TODO: Backtesting!!!
// TODO: Unit tests
// TODO: start trading
// TODO: start thinking about what the streams need to look like to make this support multiple exchanges
// TODO: factor in fees
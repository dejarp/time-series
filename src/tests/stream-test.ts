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
import CarryForward from '../core/operators/carry-forward';
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

let cycleLength5m = Periods.fiveMinutes;
let cycleLength15m = Periods.fifteenMinutes;

// Set up data sources
let closeSeries5m = PriceCloseSeries(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength5m);
let lowSeries5m = PriceLowSeries(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength5m);
let highSeries5m = PriceHighSeries(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength5m);

let closeSeries15m = PriceCloseSeries(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength15m);
let lowSeries15m = PriceLowSeries(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength15m);
let highSeries15m = PriceHighSeries(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength15m);

// Apply inidicator(s) to input data
let stochasticDStream5m = StochasticD(closeSeries5m, highSeries5m, lowSeries5m, 14, 3)
    .distinctUntilChanged(_.isEqual)
    .shareReplay();

let stochasticDStream15m = StochasticD(closeSeries15m, highSeries15m, lowSeries15m, 14, 3)
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
let highLine5m = HorizontalLine(stochasticDStream5m, 20);
let lowLine5m = HorizontalLine(stochasticDStream5m, 80);

let highLine15m = HorizontalLine(stochasticDStream15m, 20);
let lowLine15m = HorizontalLine(stochasticDStream15m, 80);

let buyPoints = HighLowCrosses(stochasticDStream5m, highLine5m);
let sellPoints = LowHighCrosses(stochasticDStream5m, lowLine5m);
let holdPoints = Or(
    HighLowCrosses(stochasticDStream5m, lowLine5m),
    LowHighCrosses(stochasticDStream5m, lowLine5m)
);

// let buyPointsFiltered = Cluster(buyPoints, sellPoints);
// let sellPointsFiltered = Cluster(sellPoints, buyPoints);

// execute the strategy (create orders, and cancel orders as needed based on strategy)
// let allocation = .1;
// let cancelOrders = CancelAllOrders(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength, holdPoints);
// let buyOrders = CreateBuyOrders(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength, buyPoints, allocation);
// let sellOrders = CreateSellOrders(API_KEY, API_SECRET, bfxFrom, bfxTo, cycleLength, sellPoints, allocation);

// let marketActions = Rx.Observable.merge(buyOrders, sellOrders, cancelOrders);

let domain5m = DateDomain(cycleLength5m);

DateRange(
    ConsoleReport({
        // 'Close (5m)': Round(closeSeries5m, 8),
        // 'Low (5m)': Round(lowSeries5m, 8),
        // 'High (5m)': Round(highSeries5m, 8),
        // 'Stoch D (5m)': Round(stochasticDStream5m, 4),
        'Close (15m)': Round(closeSeries15m, 8),
        'Low (15m)': Round(lowSeries15m, 8),
        'High (15m)': Round(highSeries15m, 8),
        'Stoch D (15m)': Round(stochasticDStream15m, 4),
        // 'Buy': buyPoints,
        // 'Sell': sellPoints,
        // 'hold': holdPoints
    }),
    AlignDate(new Date(), cycleLength15m),
    null
).subscribe(point => {
    CliClear();
    console.log(point.v.toString());
}, console.log);

// TODO: Setup email notifications
// TODO: Clearn up
// TODO: Backtesting!!!
// TODO: Unit tests
// TODO: start trading
// TODO: start thinking about what the streams need to look like to make this support multiple exchanges
// TODO: factor in fees
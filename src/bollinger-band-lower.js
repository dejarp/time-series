"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const subtract_1 = require("./subtract");
const multiply_by_1 = require("./multiply-by");
const simple_moving_average_1 = require("./simple-moving-average");
const standard_deviation_1 = require("./standard-deviation");
function BollingerBandLower(timeSeries, periods, multiplier) {
    return subtract_1.default(simple_moving_average_1.default(timeSeries, periods), multiply_by_1.default(standard_deviation_1.default(timeSeries, periods), multiplier));
}
exports.default = BollingerBandLower;
;

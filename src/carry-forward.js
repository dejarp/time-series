"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Rx = require("rxjs");
function CarryForward(timeSeries, cycles) {
    return Rx.Observable
        .combineLatest(cycles, timeSeries)
        .map((combination) => ({
        d: combination[0],
        v: combination[1].v
    }));
}
exports.default = CarryForward;

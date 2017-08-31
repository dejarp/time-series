const Rx = require('rxjs');

module.exports = function CarryForward(timeSeries, cycles) {
    return Rx.Observable
        .combineLatest(cycles, timeSeries)
        .map(combination => ({
            d: combination[0],
            v: combination[1].v
        }));
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const Rx = require("rxjs");
function Collate(multipleTimeSeries) {
    var wrappedTimeSeries = _(multipleTimeSeries)
        .mapValues((timeSeries, timeSeriesName) => {
        return timeSeries
            .map(point => ({
            name: timeSeriesName,
            point: point
        }));
    })
        .value();
    var timeSeriesNames = _.keys(wrappedTimeSeries);
    return _.spread(Rx.Observable.merge)(_.values(wrappedTimeSeries))
        .scan((accumulator, wrappedPoint) => {
        accumulator.frameToEmit = null;
        var index = _.sortedIndexBy(accumulator.bins, { date: wrappedPoint.point.d }, bin => bin.date);
        if (!accumulator.bins[index]) {
            if (accumulator.currentDate === null
                || accumulator.currentDate < wrappedPoint.point.d) {
                accumulator.bins[index] = {
                    date: wrappedPoint.point.d,
                    frame: {}
                };
            }
            else {
                // do nothing, the date on the new point is less than the current date
            }
        }
        else {
            // do nothing, no need to add bin which already exists
        }
        accumulator.bins[index].frame[wrappedPoint.name] = wrappedPoint.point;
        // if the bin just touch is full emit it
        var isBinFull = _.every(timeSeriesNames, (timeSeriesName) => _.has(accumulator.bins[index].frame, timeSeriesName));
        if (isBinFull) {
            accumulator.frameToEmit = accumulator.bins[index].frame;
            accumulator.currentDate = accumulator.bins[index].date;
            accumulator.bins.splice(0, index);
        }
        return accumulator;
    }, {
        frameToEmit: null,
        currentDate: null,
        bins: []
    })
        .map(accumulator => accumulator.frameToEmit)
        .filter(frame => frame !== null);
}
exports.Collate = Collate;
;

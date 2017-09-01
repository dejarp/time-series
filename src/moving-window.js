"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
function MovingWindow(timeSeries, periods) {
    return timeSeries
        .scan((window, point) => {
        if (_.isEmpty(window)) {
            window.push(point);
        }
        else {
            if (window[window.length - 1].d.getTime() === point.d.getTime()) {
                window[window.length - 1] = point;
            }
            else {
                return _(window).takeRight(periods - 1).push(point).value();
            }
        }
        return window;
    }, [])
        .filter(window => window.length === periods);
    //.do(window => console.log(window));
}
exports.default = MovingWindow;
;

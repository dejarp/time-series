export function BinWindow(timeSeries) {
    return timeSeries
        .scan((accumulator, point) => {
            if(accumulator.d === null || accumulator.d.getTime() !== point.d.getTime()) {
                accumulator.d = point.d;
                accumulator.v = [point.v];
            } else {
                accumulator.v.push(point.v);
            }
            return accumulator;
        }, {
            d: null,
            v: []
        });
};
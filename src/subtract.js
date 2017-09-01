const Collate = require('./collate');

module.exports = function Subtract(minuendTimeSeries, subtrahendTimeSeries) {
    return Collate({ 
        minuend: minuendTimeSeries, 
        subtrahend: subtrahendTimeSeries })
        .map(collection => ({
            d: collection.minuend.d,
            v: collection.minuend.v - collection.subtrahend.v
        }))
};
const _ = require('lodash');
const request = require('request');
const url = 'https://api.bitfinex.com/v2';

request.get( 
    `${url}/platform/status`,
    (error, response, body) =>  {
        var jsonData = JSON.parse(body);
        console.log(jsonData);
        var status = _.isArray(jsonData) && _.first(jsonData) === 1 ? 'UP': 'DOWN';
        console.log('Platform Status: ' + status);
    }
)
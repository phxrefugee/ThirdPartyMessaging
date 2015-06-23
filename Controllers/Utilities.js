/**
 * Created by PatrickM on 05/27/2015.
 */
var config = require('../config');
var http = require('http');

exports.getOlsonTimeZone = function (next, lat, long, user) {
    var options = {
        host: config.geoNamesHost,
        port: config.geoNamesPort,
        path: '/timezoneJSON?lat=' + lat + '&lng=' + long + '&username=' + user,
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    };
    //console.log('http://' + options.host + options.path);
    var req = http.request(options, function (res) {
        //console.log('Response: ' + res.statusCode);
        var output = '';
        res.on('data', function (chunk) {
            output += chunk;
        });
        res.on('end', function () {
            //console.log('Full output: ' + output);
            var parsed = JSON.parse(output);
            //console.log('Parsed TZ: ' + parsed.timezoneId);
            next(parsed.timezoneId);
        });
    });
    req.on('error', function (err) {
        console.error('Request error: ' + err.message);
    });
    req.end();
};

/*
 zeroPad function courtesy of coderjoe on StackOverflow
 http://stackoverflow.com/questions/1267283/how-can-i-create-a-zerofilled-value-using-javascript
 */
exports.zeroPad = function (num, numZeros) {
    var n = Math.abs(num);
    var zeros = Math.max(0, numZeros - Math.floor(n).toString().length );
    var zeroString = Math.pow(10,zeros).toString().substr(1);
    if( num < 0 ) {
        zeroString = '-' + zeroString;
    }

    return zeroString+n;
};

exports.stripNonNumericCharacters = function (input) {
    if (input)
        return input.toString().replace(/\D/g,'');
    else return '';
};


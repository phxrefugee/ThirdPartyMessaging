/* jslint node: true */

var https = require('https');
var mongoose = require('mongoose');
var config = require('./config');
mongoose.connect(config.mongoConnection);

var promise = require('./Controllers/PromiseChangeRequest');

var changes = require('./Controllers/MessagingChanges');

var statusEnum = {
    Unsent: 0,
    InProcess: 1,
    Success: 2,
    Failure: 3
};

var responses = function (results, err) {
    'use strict';
    console.log('passing responses...');
    //console.log(results);
    if (err) {
        console.error(err.message);
    } else {
        if (results) {
            var accessKey = config.accessKey;
            var promise = require('./Controllers/PromiseChangeRequest');
            promise.convertToPromiseChangeRequest(function (promiseChangeRequest) {
                    if (promiseChangeRequest.Elements.Element.length > 0) {
                        console.log ('Promises to send: ' + promiseChangeRequest.Elements.Element.length);
                        promise.insertPromiseChangeRequest(promiseChangeRequest);
                    }
                }, accessKey, results);
        } else {
            console.log('no records to insert');
        }
    }
};


//var data = js2xmlparser('PromiseChangeRequest', promise);
//console.log(data);


// save seed data to mongodb
/*
var seedData = require('./data/seedData');
//console.log(seedData);
seedData.save(function (err) {
    if(err) {
        console.error('Oops! ' + err.message);
    }
    else {
        console.log('Successfully saved request!');
    }
});
*/

var sendXML = function (data) {
    var today = new Date();
    var xmlData = data.xml;
    var options = {
        host: config.updatePromiseHost,
        port: config.updatePromisePort,
        path: config.updatePromisePath,
        method: 'POST',
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Content-Length': xmlData.length
        }
    };

    var req = https.request(options, function (res) {
        var msg = '';
 
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            msg += chunk;
        });
        res.on('end', function () {
            // successful submission contains ResultCode of 1
            if (msg.indexOf('<ResultCode>1</ResultCode>') > -1) {
                // update document record
                promise.updateMongoDocument(data._id, statusEnum.Success);
                changes.updateSqlRecord(data, statusEnum.Success);
                console.log('Promise Change Request ' + data._id + ' succeeded');
                console.log(data);
                console.log(msg);
           } else {
                console.error(today.toUTCString() + ': ----------------------------- Error -----------------------------');
                console.error(msg);
                console.error(today.toUTCString() + ': --------------------------- Data sent ---------------------------');
                console.error(data._id);
                console.error(today.toUTCString() + ': --------------------------- End Error ---------------------------');
                console.error();
                // update document record
                promise.updateMongoDocument(data._id, statusEnum.Failure);
                changes.updateSqlRecord(data, statusEnum.Failure);
                console.log('Promise Change Request ' + data._id + ' failed');
           }
        });
        res.on('error', function (err) {
           console.error('Error on request: ' + err.message); 
        });
    });

    req.write(xmlData);
    req.end();
//    console.log('Success!! at ' + today.toUTCString());
};

var queryResults = function (results, err) {
    'use strict';
    //var promise = require('./PromiseChangeRequest');
    if (err) {
        console.error(err.message);
    } else {
        for (var i in results) {
            sendXML(results[i]);
            console.log('results._id: ' + results[i]._id + ' submitted');
        }
    }
};

// run functions on a timer
setInterval(function (err){
        if (err)
            console.error('timer failed');
        else {
            var d = new Date();
            console.log('\n\n' + d.toISOString());
            changes.getChanges(responses);
            promise.getElements(queryResults);
        }
    }, config.pollingInterval // timer setting in milliseconds
);

//var utilities = require('./Controllers/Utilities');
//var timezone = utilities.getOlsonTimeZone(function (tz) {
//    console.log('tz: ' + tz);
//    return tz;
//    }, '45.45', '-122.7188', config.geoNamesUser
//);
//
//console.log('TimeZone: ' + timezone);
var http = require( "http" );
var port = process.env.port || 1337;
http.createServer(function ( req, res ) {
    res.writeHead(200, { "Content-Type": "text/plain"} );
    res.end( "Hello Bob!\n" );
} ).listen( port );

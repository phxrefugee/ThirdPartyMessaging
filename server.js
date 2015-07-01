/* jslint node: true */

var config = require('./config');
var promise = require('./Controllers/PromiseChangeRequest');

var express = require('express');

var http = require('http');
var https = require('https');
var path = require('path');
var fs = require('fs');
var bodyParser = require('body-parser');
var xmlparser = require('express-xml-bodyparser');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var morganLogger = require('morgan');
var app = express();

var port = process.env.port || config.httpPort;
var sslport = process.env.port || config.httpsPort;

var mongoose = require('mongoose');
mongoose.connect(config.mongoConnection);


var statusEnum = {
    Unsent: 0,
    InProcess: 1,
    Success: 2,
    Failure: 3
};

app.set('port', port);
app.set('sslport', sslport);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(morganLogger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(xmlparser());

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

app.use(express.static(path.join(__dirname, '/public')));

var httpsOptions = {
    pfx: fs.readFileSync('test/fixtures/keys/updatepromiselocalhost.pfx'),
    passphrase: ''
     /*
    key: fs.readFileSync('test/fixtures/keys/82727153-localhost.key'),
    cert: fs.readFileSync('test/fixtures/keys/82727153-localhost.cert')
    */
};
http.createServer(app).listen(app.get('port'), function ( req, res ) {
    console.log('Express server listening on port ' + app.get('port'));
});

https.createServer(httpsOptions, app).listen(app.get('sslport'), function ( req, res ) {
    console.log('Express server listening on port ' + app.get('sslport'));
});

app.post('/newmessages', function (req, res) {
    //console.log('BODY: ' + JSON.stringify(req.body, null, 2));
    if (!req.body  || req.body === undefined || !Object.keys(req.body).length)
        return res.status(400).send({message: "No body content found!"});

    // TODO: does body contain valid data?

    var promise = require('./Controllers/PromiseChangeRequest');
    var factory = require('./Controllers/PromiseChangeRequestFactory');

    // convert results to Update Promise format
    var promiseChangeRequest = factory.formatJsonAsUpdatePromise(config.accessKey, statusEnum.Unsent, req.body);
    //console.log('MSG: ' + promiseChangeRequest);
    if (promiseChangeRequest.Elements.Element.length > 0) {
        console.log ('Promises to send: ' + promiseChangeRequest.Elements.Element.length);

        promise.insertPromiseChangeRequest(promiseChangeRequest);
    } else {
        console.log('no records to insert');
    }

    res.status(200).send(true);
});

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
                //changes.updateSqlRecord(data, statusEnum.Success);
                console.log('Promise Change Request ' + data._id + ' succeeded');
                //console.log(xmlData);
                //console.log(msg);
           } else {
                console.error(today.toUTCString() + ': ----------------------------- Error -----------------------------');
                console.error(msg);
                console.error(today.toUTCString() + ': --------------------------- Data sent ---------------------------');
                console.error(data._id);
                console.error(today.toUTCString() + ': --------------------------- End Error ---------------------------');
                console.error();
                // update document record
                promise.updateMongoDocument(data._id, statusEnum.Failure);
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
//promise.updateTimeZones();
promise.getElements(queryResults);

// run functions on a timer
setInterval(function (err){
        if (err)
            console.error('timer failed');
        else {
            var d = new Date();
            console.log('\n\n' + d.toISOString());
            //changes.getChanges(responses);
            //promise.updateTimeZones();
            promise.getElements(queryResults);
        }
    }, config.pollingInterval // timer setting in milliseconds
);


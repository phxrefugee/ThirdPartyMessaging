/* jslint node: true */

var config = require('./config');
var utilities = require('./Controllers/Utilities');

var express = require('express');
//var routes = require('./routes');
var path = require('path');
var https = require( 'https' );
var fs = require('fs');
var bodyParser = require('body-parser');
var xmlparser = require('express-xml-bodyparser');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
//var methodOverride = require('method-override');
var morganLogger = require('morgan');
var app = express();

var port = process.env.port || 1337;
var sslport = process.env.port || 443;

var mongoose = require('mongoose');
mongoose.connect(config.mongoConnection);

// all environments
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

//app.get('/', routes.index);

app.use(express.static(path.join(__dirname, '/public')));

/*
var httpsOptions = {
    pfx: fs.readFileSync('test/fixtures/keys/82727153-localhost.pfx'),
    passphrase: '1qw2!QW@'
    //key: fs.readFileSync('test/fixtures/keys/82727153-localhost.key'),
    //cert: fs.readFileSync('test/fixtures/keys/82727153-localhost.cert')
};

var http = require('http');
http.createServer(app).listen(app.get('port'), function ( req, res ) {
    console.log('Express server listening on port ' + app.get('port'));
});

https.createServer(httpsOptions, app).listen(app.get('sslport'), function ( req, res ) {
    console.log('Express server listening on port ' + app.get('sslport'));
});

app.get('/now', function(req, res) {
    var d = new Date();
    res.status(200).send({date: d});
});

app.post('/newmessages', function (req, res) {
    //console.log('BODY: ' + req.body);
    if (!req.body  || req.body === undefined || !Object.keys(req.body).length)
        return res.status(400).send({message: "No body content found!"});

    // TODO: does body contain valid data?

    // convert results to Update Promise format
    var promise = require('./Controllers/PromiseChangeRequest');
    var factory = require('./Controllers/PromiseChangeRequestFactory');
    var promiseChangeRequest = factory.formatJsonAsUpdatePromise(config.accessKey, 0, req.body);
    //console.log('MSG: ' + promiseChangeRequest);
    if (promiseChangeRequest.Elements.Element.length > 0) {
        console.log ('Promises to send: ' + promiseChangeRequest.Elements.Element.length);
        // convert lat/long to timezone and insert to Mongo
        for (var i = 0; i < promiseChangeRequest.Elements.Element.length; i++) {
            var element = promiseChangeRequest.Elements.Element[i];

            utilities.getOlsonTimeZone(function (timezone) {
                element.Location[0].TimeZone = timezone;
                console.log('TZ: ' + timezone);
                console.log('inner prop: ' + element.QueueID);
                return element;
            }, element.Location[0].Latitude, element.Location[0].Longitude, config.geoNamesUser);
            console.log('outer prop: ' + element.QueueID);
        }

        promise.insertPromiseChangeRequest(promiseChangeRequest);
    } else {
    console.log('no records to insert');
    }

    res.status(200).send(true);
});*/

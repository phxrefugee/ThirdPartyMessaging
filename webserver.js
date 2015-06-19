var express = require('express');
var routes = require('./routes');
var path = require('path');
var https = require( 'https' );
var fs = require('fs');
var bodyParser = require('body-parser');
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var methodOverride = require('method-override');
var morganLogger = require('morgan');
var app = express();
var port = process.env.port || 443;

// all environments
app.set('port', port);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(morganLogger('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var xmlparser = require('express-xml-bodyparser');
app.use(xmlparser());

//app.use(function (req, res, next) {
//    res.set('X-Powered-By', 'Flight Tracker');
//    next();
//});


// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

//app.get('/', routes.index);

app.use(express.static(path.join(__dirname, '/public')));

var httpsOptions = {
    pfx: fs.readFileSync('test/fixtures/keys/82727153-localhost.pfx'),
    passphrase: '1qw2!QW@'
    /*
    key: fs.readFileSync('test/fixtures/keys/82727153-localhost.key'),
    cert: fs.readFileSync('test/fixtures/keys/82727153-localhost.cert')
    */
};
var http = require('http');
http.createServer(app).listen(1337, function ( req, res ) {
    console.log('Express server listening on port 1337');
});

https.createServer(httpsOptions, app).listen(app.get('port'), function ( req, res ) {
    console.log('Express server listening on port ' + app.get('port'));
});

app.get('/now', function(req, res) {
    var d = new Date();
    res.status(200).send({date: d});
});

app.post('/newmessages', function (req, res) {
    console.log('BODY: ' + req.body);
    if (!req.body  || req.body === undefined || !Object.keys(req.body).length)
        return res.status(400).send({message: "No body content found!"});

    // does body contain valid data?
    var messages = JSON.stringify(req.body);
    console.log('MSG: ' + messages);
    res.status(200).send(true);
});
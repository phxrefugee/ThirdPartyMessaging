/**
 * Created by PatrickM on 05/26/2015.
 */

var config = {
    // mongoDB connection
    //mongoConnection: 'mongodb://flights:flights@ds031832.mongolab.com:31832/flights',
    mongoConnection: 'mongodb://standup:standup@ds034348.mongolab.com:34348/demos',
    // update promise connection
    accessKey: '33e97066ad9bc9cb1a15ed86316da370913427a0',
    updatePromiseHost: 'test.updatepromise.com',
    updatePromisePort: '443',
    updatePromisePath: '/api/promise_api_glass.py',
    // sql connection
    sqlUser: 'sa',
    sqlPassword: 'UN0tN0This!',
    sqlServer: 'localhost',
    sqlDatabase: 'MessagingQueue',
    sqlOptions: {
        instanceName: 'SQL2014'
    },
    // geoName connection
    geoNamesHost: 'api.geonames.org',
    geoNamesPort: '80',
    geoNamesUser: 'patrickm',
    // polling frequency
    pollingInterval: 30000, // milliseconds between calls
    httpPort: 1337,
    httpsPort: 443
};

module.exports = config;
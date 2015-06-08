/**
 * Created by PatrickM on 05/26/2015.
 */

var config = {
    //mongoConnection: 'mongodb://flights:flights@ds031832.mongolab.com:31832/flights',
    mongoConnection: 'mongodb://standup:standup@ds034348.mongolab.com:34348/demos',
    accessKey: '33e97066ad9bc9cb1a15ed86316da370913427a0',
    updatePromiseHost: 'test.updatepromise.com',
    updatePromisePort: '443',
    updatePromisePath: '/api/promise_api_glass.py',
    sqlUser: 'sa',
    sqlPassword: 'UN0tN0This!',
    sqlServer: 'localhost',
    sqlDatabase: 'MessagingQueue',
    geoNamesHost: 'api.geonames.org',
    geoNamesPort: '80',
    geoNamesUser: 'patrickm',
    pollingInterval: 10000 // milliseconds between calls
};

module.exports = config;
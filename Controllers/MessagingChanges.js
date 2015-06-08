var sql = require('mssql');
var config = require('../config');
var sqlConfig = {
    user: config.sqlUser,
    password: config.sqlPassword,
    server: config.sqlServer,
    database: config.sqlDatabase
};

exports.getChanges = function (next) {
    console.log('calling MessagingChanges.GetChanges()...');
    var conn = new sql.Connection(sqlConfig, function (err) {
        if (err) {
            console.error('Connection failed: \n' + err.message);
        } else {
            var request = new sql.Request(conn);
            // get all 'new' records and update them to 'inProcess'
            var query = 'SELECT * FROM UpdatePromiseQueue ' +
                    'WHERE SubmissionResult = 0 AND CommPreference > 0' +
                    '\nUPDATE UpdatePromiseQueue SET SubmissionResult = 1 ' +
                    'WHERE SubmissionResult = 0 AND CommPreference > 0';
            request.query(query, function (err1, recordset) {
                if (err1) {
                    console.error('Query failed: \n' + err1.message);
                } else {
                    if (!recordset) console.log('no SQL results');
                    console.log('SQL Results: ' + recordset.length);
                    //console.log(recordset);
                    next(recordset);
                }
            });
        }
    });
};

exports.updateSqlRecord = function (data, status) {
    console.log('calling MessagingChanges.UpdateRecord()...');
    var conn = new sql.Connection(sqlConfig, function (err) {
        if (err) {
            console.error('Error connecting to SQL db: \n' + err.message);
        } else {
            var request = new sql.Request(conn);
            var elements = data.Elements.Element;
            var query = 'UPDATE UpdatePromiseQueue SET SubmissionResult = ' + status +
                ' WHERE QueueID IN (0';
            for (var i = 0; i < elements.length; i++) {
                query += ', ' + elements[i]['QueueID'];
            }
            query += ')';
            console.log('Updating: ' + elements.length + ' SQL records...\n' + query);
            request.query(query, function (err1) {
                    if (err1) {
                        console.error('Error executing UPDATE statement: \n' + err1.message);
                    }
                });
        }
    });
};


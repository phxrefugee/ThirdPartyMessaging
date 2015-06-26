var mongoose = require('mongoose');
var PromiseChangeRequestSchema = require('./../schemas/PromiseChangeRequest');
var PromiseChangeRequestModel = mongoose.model('PromiseChangeRequest', PromiseChangeRequestSchema, 'promisechangerequests');
var js2xmlparser = require("js2xmlparser");
var utilities = require('./Utilities');
var config = require('../config');

/*
exports.updateTimeZones = function (next) {
    // get all documents where TimeZone is empty or missing
    console.log('checking for updates...');
    var query = PromiseChangeRequestModel.find({$or: [{ "Elements.Element.Location.TimeZone": ''}, {"Elements.Element.Location.TimeZone":{$exists: false}}] }).lean();

    query.exec(function (err, results) {
        if (err) {
            console.log('cannot find new or failed requests: \n' + err.message);
            next(null, err);
        } else {
            console.log('New and failed results: ' + results.length);

            for (var i in results) {
                if (results[i] && results[i].Elements && results[i].Elements.Element) {
                    results[i].Elements.Element.forEach(function (element) {
                        var location = element.Location[0];
                        if (location && (!location.TimeZone || location.TimeZone.length == 0)) {

                            utilities.getOlsonTimeZone(function (timezone) {
                                location.TimeZone = timezone;
                                console.log('zone: ' + timezone);
                                console.log('inner prop: ' + element.Promise[0].ID);

                                PromiseChangeRequestModel.update( {$and: [{_id: results[i]._id}, {"Elements.Element": element.key}, {"Elements.Element.Promise.ID": element.Promise[0].ID}]}, {"Elements.Element.Location.TimeZone": timezone}), function (err) {
                                    if (err)
                                        console.error('Error updating document with QueueID: ' + results[i].Elements.Element.QueueID);
                                    else
                                        console.log('update succeeded for _id: ' + results[i]._id);
                                };
                            }, location.Latitude, location.Longitude, config.geoNamesUser);
                        }
                    });
                }
            }
        }
    });

};
*/

exports.getElements = function (next) {
    console.log('calling PromiseChangeRequest.GetElements()...');
    var responses = [];
    // get all documents where RequestStatus = 0, meaning not yet submitted
    var query = PromiseChangeRequestModel.find({ RequestStatus: { '$eq': 0 }}).lean();

    query.exec(function (err, results) {
        if (err) {
            console.log('cannot find new requests: \n' + err.message);
            next(null, err);
        } else {
            console.log('Mongo Results: ' + results.length);
            for (var i in results) {
                if (results[i].Elements && results[i].Elements.Element) {
                    // format boolean and date fields
                    // date fields must be in ISO8601 format, without milliseconds or timezone.
                    results[i].Elements.Element.forEach(function (element) {
                       if (element.Promise[0]) {
                           var deleteFlag = (element.Promise[0].DeleteFlag ? 1 : 0);
                           var dateQuoted = (element.Promise[0].DateQuoted ? element.Promise[0].DateQuoted.toJSON() : '');
                           var dateAppointment = (element.Promise[0].DateAppointment ? element.Promise[0].DateAppointment.toJSON() : '');
                           var dateCompleted = (element.Promise[0].DateCompleted ? element.Promise[0].DateCompleted.toJSON() : '');

                           element.Promise[0].DeleteFlag = deleteFlag;
                           element.Promise[0].DateQuoted = dateQuoted.substr(0, 19);
                           element.Promise[0].DateAppointment = dateAppointment.substr(0, 19);
                           element.Promise[0].DateCompleted = dateCompleted.substr(0, 19);
                           // console.log(deleteFlag + '; ' + dateQuoted + '; ' + dateAppointment + '; ' + dateCompleted + '; ');
                       }
                    });
                    var data = results[i];
                    // move the _id value to another variable
                    var id = results[i]._id;
                    delete results[i]._id;
                    // generate xml without the _id
                    data.xml = js2xmlparser('PromiseChangeRequest', results[i]);
                    // add the _id back to the object
                    data._id = id;
                    responses.push(data);
                    console.log('data.id: ' + data._id);
                }
            }
            next(responses);
        }
    });
};

exports.updateMongoDocument = function (idValue, isSuccess) {
    console.log('updating _id ' + idValue);
    //var _id = mongoose.Types.ObjectId(idValue);
    PromiseChangeRequestModel.update({_id: idValue}, {RequestStatus: isSuccess}, function (err) {
        if (err) console.error('Error updating document ' + idValue + ': ' + err);
    });
};

exports.insertPromiseChangeRequest = function (promiseChangeRequest) {
    console.log('called insert...');
    promiseChangeRequest.save(function (err, raw) {
        if (err)
            console.error('Error inserting document with QueueID: ' + promiseChangeRequest.Elements.Element.QueueID);
        else
            console.log('insert succeeded for _id: ' + raw._id);
    });
};
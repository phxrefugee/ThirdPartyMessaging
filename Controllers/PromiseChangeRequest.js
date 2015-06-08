var mongoose = require('mongoose');
var PromiseChangeRequestSchema = require('./../schemas/PromiseChangeRequest');
var PromiseChangeRequestModel = mongoose.model('PromiseChangeRequest', PromiseChangeRequestSchema, 'promisechangerequests');
var js2xmlparser = require("js2xmlparser");

exports.getElements = function (next) {
    console.log('calling PromiseChangeRequest.GetElements()...');
    var responses = [];
    // get all documents where RequestStatus = 0, meaning not yet submitted
    var query = PromiseChangeRequestModel.find({ RequestStatus: { '$eq': 0 }}).lean();

    query.exec(function (err, results) {
        if (err) {
            console.log('cannot execute query: \n' +err.message);
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

exports.convertToPromiseChangeRequest = function (next, accessKey, requests) {
    console.log('calling PromiseChangeRequest.ConvertAndInsert()... ');
    console.log('requests to build: ' + requests.length);
    var status = 0;
    var factory = require('./PromiseChangeRequestFactory');
    var resultSet = factory.buildObjects(accessKey, requests, status);
    console.log('instantiating new PromiseChangeRequestModel...');
    //console.log(JSON.stringify(resultSet.Elements, undefined, 2));
    var promise = new PromiseChangeRequestModel({
        AccessKey: accessKey,
        Elements: {
            Element: []
        },
        RequestStatus: status
    });
    if (resultSet && resultSet.Elements.Element.length > 0) {
        // push the elements to the array
        console.log('Pushing ' + resultSet.Elements.Element.length + ' elements to Element array...');
        for (var i = 0; i < resultSet.Elements.Element.length; i++) {
            promise.Elements.Element.push(resultSet.Elements.Element[i]);
        }
        //console.log(JSON.stringify(promise, undefined, 2));
        next(promise);
    }
};

exports.insertPromiseChangeRequest = function (promiseChangeRequest) {
    var insert = promiseChangeRequest.save(function (err, raw) {
        if (err)
            console.error('Error inserting document ' + promiseChangeRequest.Elements.Element.Promise.ID);
        else
            console.log('insert succeeded for _id: ' + raw._id);
        //console.log(JSON.stringify(raw, undefined, 2));
    });
};
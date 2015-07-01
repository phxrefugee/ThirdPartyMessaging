/**
 * Created by PatrickM on 05/19/2015.
 */
var mongoose = require('mongoose');
var utilities = require('./Utilities');

// Schemas
var CustomerSchema = require('./../schemas/Customer');
var EmployeeSchema = require('./../schemas/Employee');
var LocationSchema = require('./../schemas/Location');
var PromiseSchema = require('./../schemas/Promise');
var ElementSchema = require('./../schemas/Element');
var PromiseChangeRequestSchema = require('./../schemas/PromiseChangeRequest');
// Models
var CustomerModel = mongoose.model('Customer', CustomerSchema);
var EmployeeModel = mongoose.model('Employee', EmployeeSchema);
var LocationModel = mongoose.model('Location', LocationSchema);
var PromiseModel = mongoose.model('Promise', PromiseSchema);
var ElementModel = mongoose.model('Element', ElementSchema);
var PromiseChangeRequestModel = mongoose.model('PromiseChangeRequest', PromiseChangeRequestSchema);

exports.formatJsonAsUpdatePromise = function (accessKey, status, requestBody) {

    for (var key in requestBody) {
        if (requestBody.hasOwnProperty(key)) {
            //console.log(requestBody[key]);
            // TODO: verify element property exists
            var elementCollection = [];
            var element = requestBody[key].element;
            for (var i in element) {
                // get ENUM values from GlasPacLX.GTSBiz.clsENUMs.eMessagingPreference
                var commPreference = '';
                //console.log(element[i]);
                //console.log(element[i].commpreference[0]);
                switch(element[i].commpreference[0]) {
                    case '1':
                        commPreference = 'EMAIL';
                        break;
                    case '2':
                        commPreference = 'CALL';
                        break;
                    case '3':
                        commPreference = 'TEXT';
                        break;
                    default:
                        commPreference = '';
                }
                //console.log(commPreference);

                // build Element
                //console.log('customer...');
                var customer = new CustomerModel({
                    ID: element[i].customerid,
                    FirstName: element[i].customerfirstname,
                    LastName: element[i].customerlastname,
                    Email: element[i].customeremail,
                    MobilePhone: utilities.stripNonNumericCharacters(element[i].customermobile),
                    HomePhone: utilities.stripNonNumericCharacters(element[i].customerhome),
                    WorkPhone: utilities.stripNonNumericCharacters(element[i].customerwork),
                    CommPreference: commPreference
                });

                //console.log('employee...');
                var employee = new EmployeeModel({
                    ID: element[i].employeeid,
                    FirstName: element[i].employeefirstname,
                    LastName: element[i].employeelastname,
                    Email: element[i].employeeemail,
                    MobilePhone: utilities.stripNonNumericCharacters(element[i].employeephone)
                });

                //console.log('manager...');
                var manager = new EmployeeModel({
                    ID: element[i].managerid,
                    FirstName: element[i].managerfirstname,
                    LastName: element[i].managerlastname,
                    Email: element[i].manageremail
                });

                //console.log('location...');
                var location = new LocationModel({
                    ID: element[i].locationid + element[i].branchshortid,
                    TimeZone: element[i].timezone,
                    Latitude: Number(element[i].latitude),
                    Longitude: Number(element[i].longitude),
                    Name: element[i].branchid,
                    ShortName: element[i].branchshortid,
                    Phone: utilities.stripNonNumericCharacters(element[i].locationphone)
                });

                //console.log('promise...');
                console.log('PartsStatus: ' + element[i].isissuewithpart);
                console.log('WorkStatus: ' + element[i].isunabletocompleteinstall);
                var promise = new PromiseModel({
                    ID: element[i].promiseid,
                    ThirdPartyName: element[i].promiseinsname,
                    ThirdPartyID: element[i].promiseclaimno,
                    DateQuoted: element[i].datequoted,
                    DateAppointment: element[i].dateappointment,
                    // TODO: how to determine these values?
                    PartsStatus: (element[i].isissuewithpart == 1) ? 'DAMAGED' : '',
                    WorkStatus: (element[i].isunabletocompleteinstall == 1) ? 'UNCOMPLETABLE' : 'COMPLETABLE',
                    DateCompleted: element[i].datecompleted,
                    VehicleMake: element[i].vehiclemake,
                    DeleteFlag: element[i].deleteflag
                });

                //console.log('element: ' + element[i].queueid);
                var elementModel = new ElementModel({
                    QueueID: Number(element[i].queueid),
                    Location: location,
                    Manager: manager,
                    Employee: employee,
                    Customer: customer,
                    Promise: promise
                });

                // add to collection
                //console.log('pushing...');
                elementCollection.push(elementModel);
            }
            // build PromiseChangeRequest
            var request = new PromiseChangeRequestModel({
                AccessKey: accessKey,
                RequestStatus: status,
                Elements: {
                    Element: elementCollection
                }
            });
        }
        return request;
    }
};



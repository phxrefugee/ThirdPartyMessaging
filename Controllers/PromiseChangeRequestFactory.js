/**
 * Created by PatrickM on 05/19/2015.
 */
var mongoose = require('mongoose');
var utilities = require('./Utilities');
var config = require('../config');

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
                    TimeZone: 'Americas/Los_Angeles',
                    Latitude: Number(element[i].latitude),
                    Longitude: Number(element[i].longitude),
                    Name: element[i].branchid,
                    ShortName: element[i].branchshortid,
                    Phone: utilities.stripNonNumericCharacters(element[i].locationphone)
                });

                //console.log('promise...');
                var promise = new PromiseModel({
                    ID: element[i].promiseid,
                    ThirdPartyName: element[i].promiseinsname,
                    ThirdPartyID: element[i].promiseclaimno,
                    DateQuoted: element[i].datequoted,
                    DateAppointment: element[i].dateappointment,
                    //PartsStatus: (null) ? 'DAMAGED' : '',
                    //WorkStatus: (null) ? 'UNCOMPLETABLE' : 'COMPLETABLE',
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
/*
            console.log(element[i].latitude);
            console.log(element[i].longitude);
            console.log(element[i].databasename);
            console.log(element[i].documentguid);
            console.log(element[i].documentnumber);

            console.log(element[i].installerorder);
            console.log(element[i].submissionresult);
            console.log(element[i].lastupdated);
*/
            //console.log(elementCollection);
        }


        /*
        if (element[i]) {
            //console.log('LatLong: ' + element[i].latitude + element[i].longitude);

            utilities.getOlsonTimeZone(function (timezone) {
                location.TimeZone = timezone;
                console.log('location TZ: ' + timezone);
                return request;
            }, element[i].latitude, element[i].longitude, config.geoNamesUser);
        }
    */
    }
    return request;
};

exports.buildObjects = function (accessKey, requests, status) {
    //console.log(utilities + 'words');
    console.log('calling PromiseChangeRequestFactory.BuildObjects()...');
    console.log(requests.length + ' requests received');
    var elementCollection = [];
    // loop through each element and add to collection
    console.log('requests ' + requests.length);
    for (var i in requests) {
        var requestElement = requests[i];
        // get ENUM values from GlasPacLX.GTSBiz.clsENUMs.eMessagingPreference
        var commPreference = '';
        switch(requestElement['CommPreference']) {
            case 1:
                commPreference = 'EMAIL';
                break;
            case 2:
                commPreference = 'CALL';
                break;
            case 3:
                commPreference = 'TEXT';
                break;
            default:
                commPreference = '';
        }

        //console.log(requestElement['CommPreference'] + ' = ' + commPreference);
        // build Element
        console.log('customer...');
        var customer = new CustomerModel({
            ID: requestElement['CustomerID'],
            FirstName: requestElement['CustomerFirstName'],
            LastName: requestElement['CustomerLastName'],
            Email: requestElement['CustomerEmail'],
            MobilePhone: utilities.stripNonNumericCharacters(requestElement['CustomerMobile']),
            HomePhone: utilities.stripNonNumericCharacters(requestElement['CustomerHome']),
            WorkPhone: utilities.stripNonNumericCharacters(requestElement['CustomerWork']),
            CommPreference: commPreference
        });

        console.log('employee...');
        var employee = new EmployeeModel({
            ID: requestElement['EmployeeID'],
            FirstName: requestElement['EmployeeFirstName'],
            LastName: requestElement['EmployeeLastName'],
            Email: requestElement['EmployeeEmail'],
            MobilePhone: utilities.stripNonNumericCharacters(requestElement['EmployeePhone'])
        });

        console.log('manager...');
        var manager = new EmployeeModel({
            ID: requestElement['ManagerID'],
            FirstName: requestElement['ManagerFirstName'],
            LastName: requestElement['ManagerLastName'],
            Email: requestElement['ManagerEmail'],
            MobilePhone: utilities.stripNonNumericCharacters(requestElement['ManagerMobilePhone'])
        });

        console.log('location...');
        var location = new LocationModel({
            ID: requestElement['LocationID'] + requestElement['BranchShortID'],
            //TimeZone: 'Americas/Los_Angeles',
            Name: requestElement['BranchID'],
            ShortName: requestElement['BranchShortID'],
            Phone: utilities.stripNonNumericCharacters(requestElement['LocationPhone'])
        });

/*
         console.log('LatLong: ' + requestElement['Latitude'] + requestElement['Longitude']);
         utilities.getOlsonTimeZone(function (timezone) {
             location.TimeZone = timezone;
             console.log('location TZ: ' + timezone);
         }, requestElement['Latitude'], requestElement['Longitude'], config.geoNamesUser);
*/
        console.log('promise...');
        var promise = new PromiseModel({
            ID: requestElement['PromiseID'],
            ThirdPartyName: requestElement['PromiseInsName'],
            ThirdPartyID: requestElement['PromiseClaimNo'],
            DateQuoted: requestElement['DateQuoted'],
            DateAppointment: requestElement['DateAppointment'],
            PartsStatus: (requestElement['ReasonNotCompleted']) ? 'DAMAGED' : '',
            WorkStatus: (requestElement['ReasonNotCompleted']) ? 'UNCOMPLETABLE' : 'COMPLETABLE',
            DateCompleted: requestElement['DateCompleted'],
            VehicleMake: requestElement['VehicleMake'],
            DeleteFlag: requestElement['DeleteFlag']
        });

        console.log('element...');
        var element = new ElementModel({
            QueueID: requestElement['QueueID'],
            Location: location,
            Manager: manager,
            Employee: employee,
            Customer: customer,
            Promise: promise
        });
        //console.log('requestElement ' + element);
        // add to collection
        console.log('pushing...');
        elementCollection.push(element);
    }

    // build PromiseChangeRequest
    var request = new PromiseChangeRequestModel({
        AccessKey: accessKey,
        RequestStatus: status,
        Elements: {
            Element: elementCollection
        }
    });
    console.log(elementCollection.length + ' elements built');

    if (requests[0]) {

        console.log('LatLong: ' + requests[0]['Latitude'] + requests[0]['Longitude']);

        utilities.getOlsonTimeZone(function (timezone) {
            location.TimeZone = timezone;
            console.log('location TZ: ' + timezone);
            return request;
        }, requests[0]['Latitude'], requests[0]['Longitude'], config.geoNamesUser);
    }

    return request;
};


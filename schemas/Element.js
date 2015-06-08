var mongoose = require('mongoose');
var ElementSchema = mongoose.Schema;

var location = require('./Location.js');
var employee = require('./Employee.js');
var customer = require('./Customer.js');
var promise = require('./Promise.js');

var element = new ElementSchema({
    _id: false,
    QueueID: Number,
    Location: [location],
    Manager: [employee],
    Employee: [employee],
    Customer: [customer],
    Promise: [promise]
});

module.exports = element;

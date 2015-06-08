var mongoose = require('mongoose');
var EmployeeSchema = mongoose.Schema;

var employee = new EmployeeSchema({
    _id: false,
    ID: String,
    FirstName: String,
    LastName: String,
    Email: String,
    MobilePhone: String
});

module.exports = employee;

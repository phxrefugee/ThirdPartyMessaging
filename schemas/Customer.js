var mongoose = require('mongoose');
var CustomerSchema = mongoose.Schema;

var customer =  new CustomerSchema({
    _id: false,
    ID: String,
    FirstName: String,
    LastName: String,
    Email: String,
    MobilePhone: String,
    HomePhone: String,
    WorkPHone: String,
    CommPreference: String
});

//module.exports = mongoose.model('Customer', customer, 'customers');
module.exports = customer;
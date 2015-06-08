var mongoose = require('mongoose');
var PromiseSchema = mongoose.Schema;

// TODO: do we want to use a number for date fields?
var promise = new PromiseSchema({
    _id: false,
    ID: String,
    ThirdPartyName: String,
    ThirdPartyID: String,
    DateQuoted: Date,
    DateAppointment: Date,
    PartsStatus: String,
    WorkStatus: String,
    DateCompleted: Date,
    VehicleMake: String,
    DeleteFlag: Boolean
});

module.exports = promise;

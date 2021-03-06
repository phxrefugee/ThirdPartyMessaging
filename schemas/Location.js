var mongoose = require('mongoose');
var LocationSchema = mongoose.Schema;

var location = new LocationSchema({
    _id: false,
    ID: String,
    TimeZone: String,
    Latitude: Number,
    Longitude: Number,
    Name: String,
    ShortName: String,
    Phone: String
});

module.exports = location;

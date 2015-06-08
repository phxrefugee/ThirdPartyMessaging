var element = require('./Element.js');
var mongoose = require('mongoose');
var promiseChangeRequestSchema = mongoose.Schema;

var promiseRequest = new promiseChangeRequestSchema({
// TODO: add attribute; xmlns = 'http://www.updatepromise.com/xmlapi'
//    _id: false,
    __v: false,
    AccessKey: String,
    RequestStatus: '',
    Elements: {
        Element: [element]
    }
});

module.exports = promiseRequest;


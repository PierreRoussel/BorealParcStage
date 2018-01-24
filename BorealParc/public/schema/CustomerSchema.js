var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var CustomerSchema = new Schema({
    mail: {
        type: String,
        required: true,
        unique: true
    }
}, {
    collection: 'Customer'
});

var Customer = mongoose.model('Customer', CustomerSchema);
module.exports = Customer;

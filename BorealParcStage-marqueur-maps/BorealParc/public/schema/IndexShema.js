var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var MainSchema = new Schema({
    content : String,
    story : [ 
        {
            content : String
        }
    ],
    annonce : [ 
        {
            title : String,
            description : String,
            startDate : Date,
            endDate : Date,
            image : String
        }
    ]
}, {collection: 'Index'});

var Main = mongoose.model('Index', MainSchema);
module.exports = Main;
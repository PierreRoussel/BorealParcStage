var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Schema = mongoose.Schema;

var promotion = new Schema({
    title: { type : String },
    description: { type : String },
    startDate: { type : Date },
    endDate: { type : Date }
})

var UserSchema = new Schema({
    user : {
        login : { type: String, required: true, unique: true },
        password : { type: String, required: true }
    },
    mail : { type: String, required: true, unique: true },
    companyName : { type: String, required: true, unique: true },
    companyNameSlug : { type: String, required: true, unique: true },
    logo : { type: String },
    page : {
        presentation : String,
        contact :{
            telephone: String,
            website : String,
            facebook: String,
            twitter: String,
            instagram: String
        },
        address :{ type: String },
        schedule :{ type: String }
    },
    promotion : [promotion],
    
    leftIndicator: Number,
    rightIndicator: Number,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isSuperAdmin : Boolean
}, {collection: 'entreprise'});

UserSchema.methods.generateHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(9));
}

UserSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.user.password);
}

var User = mongoose.model('User', UserSchema);
module.exports = User;
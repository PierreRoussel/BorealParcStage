var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var User = require('./schema/UserSchema');

module.exports = function(passport){
    passport.serializeUser(function(user, done){
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done){
        User.findById(id, function(err, user){
            done(err, user);
        });
    });

    passport.use('local-signup', new LocalStrategy({
        usernameField: 'login',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, username, password, done){
        process.nextTick(function(){
            User.findOne({ 'user.login' : username },function(err, sign){
                if(err)
                    return done(err);
                if(sign)
                    return done(null, false, req.flash('signupMessage','Il existe déjà un utilisateur avec ce nom'));
                if(password != req.body.passwordVerification )
                    return done(null, false, req.flash('signupMessage','Les mots de passe ne sont pas identique'));
                else{
                    var newUser = new User();
                    newUser.user.login = username;
                    newUser.user.password = newUser.generateHash(password);
                    newUser.mail = req.body.email;
                    newUser.companyName = req.body.companyName;

                    newUser.save(function(err){
                        if(err)
                            return done(err);
                        return done(null, newUser, req.flash('signupMessage','Utilisateur bien ajouté'));
                    })
                }
            })
        })
    }))

    passport.use('local-login', new LocalStrategy({
        usernameField: 'login',
        passwordField: 'password',
        passReqToCallback: true
    },
    function(req, username, password, done){
        process.nextTick(function(){
            User.findOne({ 'user.login': username }, function(err, user){
                if(err)
                    return done(err);
                if(!user)
                    return done(null, false, req.flash('loginMessage', 'Utilisateur inconnu'));
                if(!user.validPassword(password))
                    return done(null, false, req.flash('loginMessage', 'Mot de passe invalide'));
                return done(null, user);
            })
        })
    }))
}
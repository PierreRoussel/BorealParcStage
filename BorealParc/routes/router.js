var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var passport = require('passport');
var flash = require('connect-flash');
require('../public/passport')(passport);
var path = require('path');
var fs = require('fs');
var mongoose = require('mongoose');
var User = require('../public/schema/UserSchema');
var Customer = require('../public/schema/CustomerSchema');

//////////////////////////
/// Section principale ///
//////////////////////////

//Lien vers page d'accueil
router.get('/', function (req, res, next) {
    User.find({
        isSuperAdmin: false,
        isSleepy: false
    }, function (err, user) {
        var promo = false;
        var emploi = false;

        //Tester si une promotion et une offre d'emploi existe
        for (var i = 0; i < user.length; ++i) {
            if (user[i].promotion.length != 0) {
                promo = true;
            }
            if (user[i].emploi.length != 0) {
                emploi = true;
            }
        };
        if (err)
            return done(err);
        else if (!user) //Si pas d'entreprises
            res.render('index', {
                title: 'Accueil - Boréal Parc',
                success: req.session.success
            });
        else {
            shuffle(user);
            res.render('index', {
                title: 'Accueil - Boréal Parc',
                entreprise: user,
                isLog: req.user,
                success: req.session.success,
                promo: promo,
                emploi: emploi
            });
        }
        req.session.success = false;
    })
});

//Lien vers page des promotions
router.get('/promotion', function (req, res, next) {
    User.find({
        isSuperAdmin: false
    }, function (err, user) {
        if (err)
            return done(err);
        else if (!user)
            res.render('promotion', {
                title: 'Promotion - Boréal Parc'
            });
        else {
            res.render('promotion', {
                title: 'Promotion - Boréal Parc',
                entreprise: user,
                isLog: req.user
            });
        }
    })
});


//Lien vers page des offres d'emplois
router.get('/emploi', function (req, res, next) {
    User.find({
        isSuperAdmin: false
    }, function (err, user) {
        if (err)
            return done(err);
        else if (!user)
            res.render('emploi', {
                title: 'Offre Emploi - Boréal Parc'
            });
        else {
            res.render('emploi', {
                title: 'Offre Emploi - Boréal Parc',
                entreprise: user,
                isLog: req.user
            });
        }
    })
});

/*//Subscription to the newsletter
router.post('/footer/newsletter', function (req, res, next) {
    function handleSayHello(req, res) {
        // Not the movie transporter!
        var transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'borealparc.newsletter@gmail.com', // Your email id
                pass: 'borealAdmin' // Your password
            }
        });
        var mailOptions = {
            from: 'borealparc.newsletter@gmail.com>', // sender address
            to: 'drakeyras62@gmail.com', // list of receivers
            subject: 'Email Example', // Subject line
            text: 'Hello World', // plaintext body
            // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                res.json({
                    yo: 'error'
                });
            } else {
                console.log('Message sent: ' + info.response);
                res.json({
                    yo: info.response
                });
            };
        });
    }

    var newCustomer = new Customer({
        mail: req.body.mailCustomer
    });

    newCustomer.mail = req.body.mailCustomer;
    newCustomer.save();
    req.session.success = true;
    res.redirect('/');
});*/

//////////////////////////
/// Section entreprise ///
//////////////////////////
//administration shoudn't be displayed
router.get('/entreprise/administration', function (req, res, next) {
    res.redirect('/');
})
router.get('/entreprise/:companyNameSlug', function (req, res, next) {
    User.findOne({
        'companyNameSlug': req.params.companyNameSlug
    }, function (err, user) {
        if (err)
            return done(err);
        else if (!user)
            res.redirect('/');
        else res.render('entreprise', {
            title: user.companyName,
            entreprise: user,
            isLog: req.user
        });
    })
})
/////////////////////////////////////
/// Login/Register/Logout Section ///
/////////////////////////////////////
router.get('/login', function (req, res, next) {
    res.render('login', {
        title: 'Login',
        message: req.flash('loginMessage')
    });
});

router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/dashboard',
    failureRedirect: 'login',
    failureFlash: true
}));

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/')
});

/////////////////////////////////////
/// Section Dashboard SUPER-ADMIN ///
/////////////////////////////////////
//Affichage de la liste des entreprises
router.get('/dashboard', isSuperAdmin, function (req, res) {
    User.find({
            isSuperAdmin: false
        })
        .then(function (doc) {
            res.render('admin/dashboard.superadmin-home.hbs', {
                title: 'Dashboard SuperAdmin',
                message: req.flash('signupMessage'),
                isLog: req.user,
                items: doc
            });
        });
});
//En attente 
router.get('/dashboard/hide/:id', isSuperAdmin, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.params.id);

    User.findById(mongoId, function (err, doc) {
        if (err) {
            return done(err);
        } else {
            doc.isSleepy = true;

            doc.save();
        }
    })
    res.redirect('/dashboard/');
})
//En service
router.get('/dashboard/reveal/:id', isSuperAdmin, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.params.id);
    User.findById(mongoId, function (err, doc) {
        if (err) {
            return done(err);
        } else {
            doc.isSleepy = false;
            doc.save();
        }
    })
    res.redirect('/dashboard/');
})
//Affichage de l'entreprise à modifier
router.get('/dashboard/update/:id', isSuperAdmin, function (req, res, next) {
    var mongoId = mongoose.Types.ObjectId(req.params.id);
    User.findById(mongoId, function (err, doc) {
        if (err) {
            return done(err);
        } else {
            res.render('admin/dashboard.superadmin-shop-content.hbs', {
                title: 'Modification magasin - Dashboard SuperAdmin',
                isLog: req.user,
                success: req.session.success,
                errors: req.session.errors,
                item: doc
            });
            req.session.success = false;
            req.session.errors = null;
        }
    })
});
//Modification de l'entreprise
router.post('/dashboard/update', isSuperAdmin, function (req, res, next) {
    req.check('presentation', 'La présentation est vide').notEmpty();
    req.check('website', 'Le format du lien du site n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('catalogue', 'Le format du lien du catalogue n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('pjaunes', 'Le format du lien des Pages-Jaunes n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('facebook', 'Le format du lien facebook n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('twitter', 'Le format du lien twitter n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('instagram', 'Le format du lien instagram n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('leftIndicator', 'Le positionnement horizontal doit être un chiffre').optional({
        checkFalsy: true
    }).isInt();
    req.check('rightIndicator', 'Le positionnement vertical doit être un chiffre').optional({
        checkFalsy: true
    }).isInt();
    req.check('leftIndicator', 'Le positionnement horizontal doit être compris entre 0 et 100').optional({
        checkFalsy: true
    }).isIntRange(0, 100);
    req.check('rightIndicator', 'Le positionnement vertical doit être compris entre 0 et 100').optional({
        checkFalsy: true
    }).isIntRange(0, 100);
    req.check('telephone', 'Le format du téléphone n\'est pas correct').optional({
        checkFalsy: true
    }).isNumero();

    var errors = req.validationErrors();
    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
    } else {
        User.findById(req.body.id, function (err, doc) {
            if (err) {
                return done(err);
            }
            doc.page.presentation = req.body.presentation;
            doc.page.address = req.body.address;
            doc.page.contact.website = req.body.website;
            doc.page.contact.catalogue = req.body.catalogue;
            doc.page.contact.facebook = req.body.facebook;
            doc.page.contact.twitter = req.body.twitter;
            doc.page.contact.instagram = req.body.instagram;
            doc.page.pjaunes = req.body.pjaunes;
            doc.page.schedule = req.body.schedule;
            doc.leftIndicator = req.body.leftIndicator;
            doc.rightIndicator = req.body.rightIndicator;
            doc.page.contact.telephone = telephoneShape(req.body.telephone);

            doc.save();
        })
        req.session.success = true;
    }
    res.redirect("/dashboard/update/" + req.body.id);
});

//modification du compte entreprise
//Modification des informations du compte entreprise
router.get('/dashboard/shop-update/:id', isSuperAdmin, function (req, res, next) {
    var mongoId = mongoose.Types.ObjectId(req.params.id);
    User.findById(mongoId, function (err, doc) {
        if (err) {
            return done(err);
        } else {
            res.render('admin/dashboard.superadmin-shop-account-modification.hbs', {
                title: 'Modification compte - Dashboard SuperAdmin',
                isLog: req.user,
                success: req.session.success,
                errors: req.session.errors,
                item: doc
            });
            req.session.success = false;
            req.session.errors = null;
        }
    })
});
router.post('/dashboard/shop-update', isSuperAdmin, function (req, res, next) {
    req.check('mail', 'Le format de l\'email n\'est pas correct').notEmpty().isEmail();
    req.check('newPassword', 'Le champ nouveau mot de passe est vide').optional({
        checkFalsy: true
    }).notEmpty();
    req.check('newPassword', 'Le mot de passe doit posséder au minimum 6 caractères').optional({
        checkFalsy: true
    }).len(6, 20);
    req.check('newPassword', 'Les mots de passe ne sont pas identiques').isEqual(req.body.newPasswordVerification);
    req.check('newPasswordVerification', 'La verification du mot de passe est vide').optional({
        checkFalsy: true
    }).notEmpty();
    req.check('companyName', 'Le champ nom d\'entreprise est vide').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
    } else {
        User.findById(req.body.id, function (err, doc) {
            if (err) {
                return done(err);
            }
            doc.mail = req.body.mail;
            doc.user.password = doc.generateHash(req.body.newPassword);
            doc.user.login = req.body.login;
            doc.companyName = req.body.companyName;
            doc.companyNameSlug = stringToSlug(req.body.companyName);
            doc.save();
        })
        req.session.success = true;
    }
    res.redirect("/dashboard/shop-update/" + req.body.id);
});

//Modification logo de l'entreprise
router.post('/dashboard/update/logo', isSuperAdmin, function (req, res, next) {
    mongoId = mongoose.Types.ObjectId(req.body.id);
    if (!req.files.logo) {
        req.session.errors = [{
            msg: "Vous n'avez pas mis d'image"
        }];
        req.session.success = false;

    } else {
        var sampleFile = req.files.logo;
        var fileName = req.body.companyNameSlug + '.' + sampleFile.name.split('.')[sampleFile.name.split('.').length - 1]
        sampleFile.name = fileName;
        upload('logo', sampleFile, req.session, mongoId);
        User.findById(mongoId, function (err, doc, logoName) {
            if (err) {
                return done(err);
            }
            doc.logo = fileName;
            doc.save();
        });
    }
    res.redirect("/dashboard/update/" + mongoId);
});

//Suppression entreprises
router.get('/dashboard/delete/:id', function (req, res, next) {
    User.findById(req.params.id, function (err, doc) {
        if (err) {
            return done(err);
        }
        if (doc.logo != "") {
            //On teste si l'image n'existe pas dans d'autres formats et on les supprimes
            var logoPathJpg = path.join(__dirname, '../public/images/logo/') + doc.logo.split('.')[doc.logo.split('.').length - 2] + '.jpg';
            var logoPathPng = path.join(__dirname, '../public/images/logo/') + doc.logo.split('.')[doc.logo.split('.').length - 2] + '.png';
            var logoPathJpeg = path.join(__dirname, '../public/images/logo/') + doc.logo.split('.')[doc.logo.split('.').length - 2] + '.jpeg';
            var ext = [logoPathJpg, logoPathPng, logoPathJpeg];
            var deletion = function (extension, userId, next) {
                ext.forEach(function (element) {
                    if (fs.existsSync(element)) {
                        fs.unlinkSync(element);
                    }
                });
                next(userId);
            };
            //next() doit être exécuté après sinon node cherche à supprimer une référence d'image qui n'existe déjà plus
            deletion(ext, req.params.id, function (mongoId) {
                User.findByIdAndRemove(mongoId).exec();
                res.redirect('/dashboard');
            });
        } else {
            User.findByIdAndRemove(req.params.id).exec();
            res.redirect('/dashboard');
        }
    });
});
/*La création d'un compte magasin doit nécessairement passer par ici, la magasin recevra ses identifiants depuis le super-administrateur et pourra 
modifier son mot de passe par la suite */
router.get('/dashboard/creation-compte-magasin', isSuperAdmin, function (req, res) {
    res.render('admin/dashboard.superadmin-shop-account-creation.hbs', {
        title: 'Création compte magasin - Dashboard SuperAdmin',
        isLog: req.user,
        success: req.session.success,
        errors: req.session.errors,
        lastPostItem: req.session.lastPostItem
    });
    req.session.success = false;
    req.session.errors = null;
    req.session.lastPostItem = null;
});

router.post('/dashboard/creation-compte-magasin', isSuperAdmin, function (req, res) {
    req.check('companyName', 'Le nom de l\'entreprise est vide').notEmpty();
    req.check('login', 'Le login est vide').notEmpty();
    req.check('mail', 'L\'email de l\'entreprise est vide').notEmpty();
    req.check('mail', 'Le format de l\'email n\'est pas correct').isEmail();
    req.check('password', 'Le mot de passe est vide').notEmpty();
    req.check('password', 'Le mot de passe doit posséder au minimum 6 caractères').len(6, 20);
    req.check('password', 'Les mots de passe ne sont pas identiques').isEqual(req.body.passwordVerification);
    req.check('passwordVerification', 'La verification du mot de passe est vide').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
        var lastPostItem = {
            companyName: req.body.companyName,
            login: req.body.login,
            mail: req.body.mail
        };
        req.session.lastPostItem = lastPostItem;
    } else {
        //Create a new item inside the database
        var newUser = new User();
        newUser.user.login = req.body.login;
        newUser.user.password = newUser.generateHash(req.body.password);
        newUser.mail = req.body.mail;
        newUser.companyName = req.body.companyName;
        newUser.companyNameSlug = stringToSlug(req.body.companyName);
        newUser.logo = "";
        newUser.isSleepy = true;
        newUser.isSuperAdmin = false;
        newUser.save(function (err) {
            if (err) {
                return done(err);
            }
        });
        req.session.success = true;
    }
    res.redirect('/dashboard/creation-compte-magasin');
});

router.get('/dashboard/modification-elements-site', isSuperAdmin, function (req, res) {
    res.render('admin/dashboard.superadmin-site-modification.hbs', {
        title: 'Modification élément site - Dashboard SuperAdmin',
        isLog: req.user,
        success: req.session.success,
        errors: req.session.errors
    });
    req.session.success = false;
    req.session.errors = null;
});
router.post('/dashboard/modification-elements-site', isSuperAdmin, function (req, res) {

    uploadSimple(req.files.borealmap, req.session, 'borealmap', function (err) {
        if (err) {
            return
        }
    });
    res.redirect('/dashboard/modification-elements-site');
});
//Section modification du mot de passe superadmin
router.get('/dashboard/modification-mot-de-passe-superadmin', isSuperAdmin, function (req, res) {
    res.render('admin/dashboard.superadmin-password.hbs', {
        title: 'Modification mot de passe - Dashboard SuperAdmin',
        isLog: req.user,
        success: req.session.success,
        errors: req.session.errors
    });
    req.session.success = false;
    req.session.errors = null;
});
router.post('/dashboard/modification-mot-de-passe-superadmin', isSuperAdmin, function (req, res) {
    //TODO verifier que l'ancien mot de passe rentré par l'utilisateur est bien le bon
    req.check('oldPassword', 'L\' ancien mot de passe est invalide').isValidPassword(req.user.user.password);
    req.check('newPassword', 'Le champ nouveau mot de passe est vide').notEmpty();
    req.check('newPassword', 'Le mot de passe doit posséder au minimum 6 caractères').len(6, 20);
    req.check('newPassword', 'Les mots de passe de sont pas identiques').isEqual(req.body.newPasswordVerification);
    req.check('newPasswordVerification', 'La verification du mot de passe est vide').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
    } else {
        User.findById(req.session.passport.user, function (err, user) {
            if (err) return done(err);
            user.user.password = user.generateHash(req.body.newPassword);
            user.save(function (err, updatedTank) {
                if (err) return done(err);
                req.session.success = true;
            });
        });
    }
    res.redirect('/dashboard/modification-mot-de-passe-superadmin');
});


//Changement bannière
router.get('/dashboard/background-modification', isSuperAdmin, function (req, res) {
    res.render('admin/dashboard.superadmin-background-modification.hbs', {
        title: 'Modification bannière - Dashboard SuperAdmin',
        isLog: req.user,
        success: req.session.success,
        errors: req.session.errors
    });
    req.session.success = false;
    req.session.errors = null;
});

router.post('/dashboard/background-modification', isSuperAdmin, function (req, res) {
    uploadSimple(req.files.borealback, req.session, 'boreal_back', function (err) {
        if (err) {
            return
        }
    });
    res.redirect('/dashboard/background-modification');
});



/////////////////////////////////
/// Section Dashboard MAGASIN ///
/////////////////////////////////

//////// GET ////////
router.get('/dashboard/contenu-magasin', isLoggedIn, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.user._id);
    User.findById(mongoId, function (err, doc) {
        if (err) {
            return done(err);
        } else {
            res.render('admin/dashboard.shopadmin-shop-content.hbs', {
                title: 'Modification magasin - Dashboard Magasin',
                isLog: req.user,
                success: req.session.success,
                errors: req.session.errors,
                item: doc
            });
            req.session.success = false;
            req.session.errors = null;
        }
    })
});
//////// POST A ////////ENREGISTREMENT DU LOGO D'ENTREPRISE
router.post('/dashboard/contenu-magasin/logo', isLoggedIn, function (req, res) {
    mongoId = mongoose.Types.ObjectId(req.body.id);
    if (!req.files.logo) {

        req.session.errors = [{
            msg: "Vous n'avez pas mis d'image"
        }];
        req.session.success = false;

    } else {
        var sampleFile = req.files.logo;
        var fileName = req.body.companyNameSlug + '.' + sampleFile.name.split('.')[sampleFile.name.split('.').length - 1]
        sampleFile.name = fileName;
        upload('logo', sampleFile, req.session, mongoId);
        User.findById(mongoId, function (err, doc, logoName) {
            if (err) {
                return done(err);
            }
            doc.logo = fileName;
            doc.save();
        });
    }
    res.redirect('/dashboard/contenu-magasin')
});
//////// POST B ////////ENREGISTREMENT DES DONNES GENERALES
router.post('/dashboard/contenu-magasin', isLoggedIn, function (req, res) {
    req.check('presentation', 'La présentation est vide').notEmpty();
    req.check('website', 'Le format du lien du site n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('facebook', 'Le format du lien facebook n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('pjaunes', 'Le format du lien des Pages-Jaunes n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('catalogue', 'Le format du lien du catalogue n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('twitter', 'Le format du lien twitter n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('instagram', 'Le format du lien instagram n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('leftIndicator', 'Le positionnement horizontal doit être un chiffre').optional({
        checkFalsy: true
    }).isInt();
    req.check('rightIndicator', 'Le positionnement vertical doit être un chiffre').optional({
        checkFalsy: true
    }).isInt();
    req.check('leftIndicator', 'Le positionnement horizontal doit être compris entre 0 et 100').optional({
        checkFalsy: true
    }).isIntRange(0, 100);
    req.check('rightIndicator', 'Le positionnement vertical doit être compris entre 0 et 100').optional({
        checkFalsy: true
    }).isIntRange(0, 100);
    req.check('telephone', 'Le format du téléphone n\'est pas correct').optional({
        checkFalsy: true
    }).isNumero();
    var errors = req.validationErrors();
    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
    } else {
        User.findById(req.body.id, function (err, doc) {
            if (err) {
                return done(err);
            }
            doc.page.presentation = req.body.presentation;
            doc.page.address = req.body.address;
            doc.page.contact.website = req.body.website;
            doc.page.contact.catalogue = req.body.catalogue;
            doc.page.contact.facebook = req.body.facebook;
            doc.page.contact.twitter = req.body.twitter;
            doc.page.contact.instagram = req.body.instagram;
            doc.page.pjaunes = req.body.pjaunes;
            doc.page.schedule = req.body.schedule;
            doc.leftIndicator = req.body.leftIndicator;
            doc.rightIndicator = req.body.rightIndicator;
            doc.page.contact.telephone = telephoneShape(req.body.telephone);
            doc.save();
        })
        req.session.success = true;
    }
    res.redirect("/dashboard/contenu-magasin");
});
//////// POST C ////////ENREGISTREMENT DES IMAGES POUR LES ENTREPRISES
router.post('/dashboard/contenu-magasin/photo', isLoggedIn, function (req, res) {
    mongoId = mongoose.Types.ObjectId(req.body.id);
    //SAUVEGARDER L'IMAGE 1
    var sampleFile1 = req.files.photo1;
    if (sampleFile1 != undefined) {
        var fileName1 = req.body.companyNameSlug + '1.' + sampleFile1.name.split('.')[sampleFile1.name.split('.').length - 1]
        sampleFile1.name = fileName1;
        upload('photo', sampleFile1, req.session, mongoId);
    }
    //SAUVEGARDER L'IMAGE 2
    var sampleFile2 = req.files.photo2;
    if (sampleFile2 != undefined) {
        var fileName2 = req.body.companyNameSlug + '2.' + sampleFile2.name.split('.')[sampleFile2.name.split('.').length - 1]
        sampleFile2.name = fileName2;
        upload('photo', sampleFile2, req.session, mongoId);
    }
    //SAUVEGARDER L'IMAGE 3
    var sampleFile3 = req.files.photo3;
    if (sampleFile3 != undefined) {
        var fileName3 = req.body.companyNameSlug + '3.' + sampleFile3.name.split('.')[sampleFile3.name.split('.').length - 1]
        sampleFile3.name = fileName3;
        upload('photo', sampleFile3, req.session, mongoId);
    }
    //SAUVEGARDER L'IMAGE 4
    var sampleFile4 = req.files.photo4;
    if (sampleFile4 != undefined) {
        var fileName4 = req.body.companyNameSlug + '4.' + sampleFile4.name.split('.')[sampleFile4.name.split('.').length - 1]
        sampleFile4.name = fileName4;
        upload('photo', sampleFile4, req.session, mongoId);
    }

    var errors = req.validationErrors();
    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
    } else {
        User.findById(req.body.id, function (err, doc) {
            if (err) {
                return done(err);
            }
            var fileNames = [fileName1, fileName2, fileName3, fileName4];
            for (i = 1; i < 5; i++) {
                if (fileNames[i - 1] != undefined) {
                    switch (i) {
                        case 1:
                            doc.photo.image1 = fileName1;
                            console.log("BIJOUR1");
                            break;
                        case 2:
                            doc.photo.image2 = fileName2;
                            console.log("BIJOUR2");
                            break;
                        case 3:
                            doc.photo.image3 = fileName3;
                            console.log("BIJOUR3");
                            break;
                        case 4:
                            doc.photo.image4 = fileName4;
                            console.log("BIJOUR4");
                            break;
                    }
                }
            }
            doc.save();
        });
        req.session.success = true;
    }
    res.redirect('/dashboard/contenu-magasin#ancrePhoto')
});

////// * Le magasin peut ici modifier les informations de son compte * //////
//////// GET ////////
router.get('/dashboard/admin-shop-update', isLoggedIn, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.user._id);
    User.findById(mongoId, function (err, doc) {
        if (err) {
            return done(err);
        } else {
            res.render('admin/dashboard.shopadmin-account-modification.hbs', {
                title: 'Modification compte - Dashboard Admin',
                isLog: req.user,
                success: req.session.success,
                errors: req.session.errors,
                item: doc
            });
            req.session.success = false;
            req.session.errors = null;
        }
    })
});
//////// POST ////////
router.post('/dashboard/admin-shop-update', isLoggedIn, function (req, res) {
    req.check('mail', 'Le format de l\'email n\'est pas correct').notEmpty().isEmail();
    req.check('newPassword', 'Le champ nouveau mot de passe est vide').optional({
        checkFalsy: true
    }).notEmpty();
    req.check('newPassword', 'Le mot de passe doit posséder au minimum 6 caractères').optional({
        checkFalsy: true
    }).len(6, 20);
    req.check('newPassword', 'Les mots de passe ne sont pas identiques').isEqual(req.body.newPasswordVerification);
    req.check('newPasswordVerification', 'La verification du mot de passe est vide').optional({
        checkFalsy: true
    }).notEmpty();
    req.check('companyName', 'Le champ nom d\'entreprise est vide').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
    } else {
        User.findById(req.body.id, function (err, doc) {
            if (err) {
                return done(err);
            }
            doc.mail = req.body.mail;
            doc.user.password = doc.generateHash(req.body.newPassword);
            doc.user.login = req.body.login;
            doc.companyName = req.body.companyName;
            doc.companyNameSlug = stringToSlug(req.body.companyName);
            doc.save();
        })
        req.session.success = true;
    }
    res.redirect("/dashboard/admin-shop-update");
});

//////////////////////////////
/////  FONCTION ADHERENT /////
//////////////////////////////
//Rend l'entreprise non-adhérente
router.get('/dashboard/non-adherent/:id', isSuperAdmin, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.params.id);

    User.findById(mongoId, function (err, doc) {
        if (err) {
            return done(err);
        } else {
            doc.isAdherent = false;
            doc.save();
        }
    })
    res.redirect('/dashboard/');
})
//Rend l'entreprise adhérente
router.get('/dashboard/adherent/:id', isSuperAdmin, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.params.id);
    User.findById(mongoId, function (err, doc) {
        if (err) {
            return done(err);
        } else {
            doc.isAdherent = true;
            doc.save();
        }
    })
    res.redirect('/dashboard/');
})

//////////////////////////////
/////  FONCTION MAILING  /////
//////////////////////////////

//Subscription to the newsletter
router.post('/footer/newsletter', function (req, res) {
    req.check('mailCustomer', 'Le format de l\'email n\'est pas correct').notEmpty().isEmail();
    var newCustomer = new Customer({
        mail: req.body.mailCustomer
    });
    newCustomer.mail = req.body.mailCustomer;
    newCustomer.save(function (err) {
        if (err) {
            return console.log('error');
        }
    });
    req.session.success = true;
    res.redirect('/#btn-newsletter');
})

//Page d'envoie de newsletter
router.get('/dashboard/mail', isSuperAdmin, function (req, res, next) {
    var mongoId = mongoose.Types.ObjectId(req.params.id);
    User.findById(mongoId, function (err, doc) {
        if (err) {
            return done(err);
        } else {
            res.render('admin/mail.hbs', {
                title: 'Envoie mail - Dashboard SuperAdmin',
                isLog: req.user,
                success: req.session.success,
                errors: req.session.errors,
                item: doc
            });
            req.session.success = false;
            req.session.errors = null;
        }
    })
});
router.post('/mail', function (req, res, next) {
    var transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        auth: {
            user: "borealparc.newsletter@gmail.com",
            pass: "borealAdmin"
        }
    });
    var mailOptions = {
        from: 'borealparc.newsletter@gmail.com',
        to: req.body.destination,
        subject: req.body.subject,
        text: req.body.message,
        html: '<b>' + req.body.message + '</b>'
    };
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });
    transporter.close();
    res.redirect('/dashboard/mail');
});

////////////////////////////////
/////  FONCTION PROMOTION  /////
////////////////////////////////

//Lien vers page création promotion
router.get('/dashboard/creation-promotion', isLoggedIn, function (req, res) {
    res.render('admin/dashboard.creation-promotion.hbs', {
        title: 'Création promotion',
        isLog: req.user,
        success: req.session.success,
        errors: req.session.errors,
    });
    req.session.success = false;
    req.session.errors = null;
});

//Crréation de promotion
router.post('/dashboard/creation-promotion', isLoggedIn, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.user._id);
    console.log(req.files);
    req.check('title', 'Le titre est vide').notEmpty();
    req.check('description', 'La description est vide').notEmpty();
    req.check('startDate', 'La date de debut est vide').notEmpty();
    req.check('endDate', 'La date de fin est vide').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
    } else {
        User.findOneAndUpdate({
                _id: mongoId
            }, {
                $push: {
                    promotion: {
                        title: req.body.title,
                        description: req.body.description,
                        startDate: req.body.startDate,
                        endDate: req.body.endDate
                    }
                }
            },
            function (err, model) {
                //Enregistrement image après création de la promotion
                User.findOne({
                        _id: mongoId
                    },
                    function (err, model) {
                        var idNouvellePromo = model.promotion[model.promotion.length - 1].id;
                        if (!req.files.picture) { //Si pas d'image alors prendre celle de l'entreprise
                            User.findOne(mongoId, function (err, model) { //Récupération tableau des promotions de l'entreprise
                                for (var i = 0; i < model.promotion.length; i++) {
                                    if (model.promotion[i]._id == idNouvellePromo) {
                                        model.promotion[i].picture = "/logo/" + model.logo;
                                        model.save();
                                    }
                                }
                            });
                        } else { //sinon upload de la nouvelle image
                            var sampleFile = req.files.picture;
                            var fileName = idNouvellePromo + '.' + sampleFile.name.split('.')[sampleFile.name.split('.').length - 1]
                            sampleFile.name = fileName;
                            upload('promotion', sampleFile, req.session, mongoId);
                            User.findOne(mongoId, function (err, model) { //Récupération tableau des promotions de l'entreprise
                                for (var i = 0; i < model.promotion.length; i++) {
                                    if (model.promotion[i]._id == idNouvellePromo) {
                                        model.promotion[i].picture = "/promotion/" + fileName;
                                        model.save();
                                    }
                                }
                            });
                        }
                    }

                )

            }

        )
        req.session.success = true;
    }
    res.redirect("/dashboard/creation-promotion");
});

//Affichage liste des promotions des entreprises
router.get('/dashboard/liste-promotion', isLoggedIn, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.user._id);
    User.findOne({
            _id: mongoId,
        })
        .then(function (doc) {
            res.render('admin/dashboard.liste-promotion.hbs', {
                title: 'Liste Promotions',
                message: req.flash('signupMessage'),
                isLog: req.user,
                items: doc.promotion
            });
        });

});

//Affichage informations dans la page de modification de promotion
router.get('/dashboard/modification-promotion/:id', isLoggedIn, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.user._id);
    var promoId = mongoose.Types.ObjectId(req.params.id);
    User.findOne({
        'promotion._id': promoId
    }, function (err, model) {
        function BonnePromo(Promo) {
            return Promo.id == promoId;
        }
        var promo = model.promotion.find(BonnePromo);
        res.render('admin/dashboard.modification-promotion.hbs', {
            title: 'Modification Promotion',
            message: req.flash('signupMessage'),
            isLog: req.user,
            item: promo,
        })
    })
});

//Upload modification image promotion
router.post('/dashboard/picture-modification/:id', isLoggedIn, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.user._id);
    var promoId = mongoose.Types.ObjectId(req.params.id);
    if (!req.files.picture) { // Si aucune image envoyée
        req.session.errors = [{
            msg: "Vous n'avez pas mis d'image"
        }];
        req.session.success = false;
    } else {
        var sampleFile = req.files.picture;
        var fileName = promoId + '.' + sampleFile.name.split('.')[sampleFile.name.split('.').length - 1]
        sampleFile.name = fileName;
        upload('promotion', sampleFile, req.session, mongoId);
        User.findOne(mongoId, function (err, model) {
            for (var i = 0; i < model.promotion.length; i++) { //Parcourir le tableau de promotions de l'entreprise
                if (model.promotion[i]._id == req.params.id) { // Si l'id est le même que celui récupéré avant               
                    model.promotion[i].picture = "/promotion/" + fileName;
                    model.save();
                }
            }
        });
    }
    res.redirect("/dashboard/modification-promotion/" + promoId);
});

//Modification promotion
router.post('/dashboard/modification-promotion/:id', isLoggedIn, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.user._id);
    var promoId = mongoose.Types.ObjectId(req.params.id);
    req.check('title', 'Le titre est vide').notEmpty();
    req.check('description', 'La description est vide').notEmpty();
    req.check('startDate', 'La date de debut est vide').notEmpty();
    req.check('endDate', 'La date de fin est vide').notEmpty();
    User.findOne(mongoId, function (err, model) {
        for (var i = 0; i < model.promotion.length; i++) { //Parcourir le tableau de promotions de l'entreprise
            if (model.promotion[i]._id == req.params.id) { // Si l'id est le même que celui récupéré avant 
                model.promotion[i].title = req.body.title;
                model.promotion[i].description = req.body.description;
                model.promotion[i].startDate = req.body.startDate;
                model.promotion[i].endDate = req.body.endDate;
                model.save();
            }
        }
    });
    res.redirect("/dashboard/liste-promotion/");
});

//Suppression de promotion
router.get('/dashboard/supprimer/promotion/:id', function (req, res, next) {
    var mongoId = mongoose.Types.ObjectId(req.user._id);
    var promoId = mongoose.Types.ObjectId(req.params.id);
    User.findOne(mongoId, function (err, model) { //D'abord suppression de l'image de la promotion
        for (var i = 0; i < model.promotion.length; i++) {
            if ((model.promotion[i]._id == req.params.id) && (model.promotion[i].picture != model.promotion[i].picture.substring('../logo/', 0))) {
                fs.unlink("./public/images/promotion/" + model.promotion[i].picture, (err) => {
                    if (err) {
                        console.log("Image pas supprimée " + err)
                    } else {
                        console.log('Image supprimée')
                    }
                })
            }
        }
    });
    User.findOneAndUpdate({ //Ensuite suppression de la promotion
            _id: mongoId
        }, {
            $pull: {
                promotion: {
                    _id: req.params.id
                }
            }
        },
        function (err, model) {
            console.log('Error: ' + model);
        }
    )
    res.redirect('/dashboard/liste-promotion/');
});


////////////////////////////////
/////  FONCTION EMPLOI     /////
////////////////////////////////

//Page création offre d'emploi
router.get('/dashboard/creation-emploi', isLoggedIn, function (req, res) {
    res.render('admin/dashboard.creation-emploi.hbs', {
        title: 'Création offre emploi',
        isLog: req.user,
        success: req.session.success,
        errors: req.session.errors,
    });
    req.session.success = false;
    req.session.errors = null;
})

//Création offre d'emploi
router.post('/dashboard/creation-emploi', isLoggedIn, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.user._id);
    req.check('title', 'Le titre est vide').notEmpty();
    req.check('description', 'La description est vide').notEmpty();
    req.check('poste', 'Le titre du poste est vide').notEmpty();
    var errors = req.validationErrors();
    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
    } else {
        User.findOneAndUpdate({ //Création de l'offre
                _id: mongoId
            }, {
                $push: {
                    emploi: {
                        title: req.body.title,
                        description: req.body.description,
                        poste: req.body.poste
                    }
                }
            },
            function (err, model) {
                //Ajout du lien vers le logo de l'entreprise après création de l'offre d'emploi
                User.findOne({
                        _id: mongoId
                    },
                    function (err, model) {
                        var idNouvelleOffre = model.emploi[model.emploi.length - 1].id;
                        User.findOne(mongoId, function (err, model) { //Récupération tableau des offres d'emplois de l'entreprise
                            for (var i = 0; i < model.emploi.length; i++) {
                                if (model.emploi[i]._id == idNouvelleOffre) {
                                    model.emploi[i].picture = "/logo/" + model.logo;
                                    model.save();
                                }
                            }
                        });
                    }

                )

            }

        )
        req.session.success = true;
    }
    res.redirect("/dashboard/creation-emploi");
});

//Affichages liste des offres d'emploi
router.get('/dashboard/liste-emploi', isLoggedIn, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.user._id);
    User.findOne({
            _id: mongoId,
        })
        .then(function (doc) {
            res.render('admin/dashboard.liste-emploi.hbs', {
                title: 'Liste Offre Emploi',
                message: req.flash('signupMessage'),
                isLog: req.user,
                items: doc.emploi
            });
        });

});

//Affichage infos dans modification emploi
router.get('/dashboard/modification-emploi/:id', isLoggedIn, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.user._id);
    var emploiId = mongoose.Types.ObjectId(req.params.id);
    User.findOne({
        'emploi._id': emploiId
    }, function (err, model) {
        function BonneOffre(Emploi) {
            return Emploi.id == emploiId;
        }
        var offre = model.emploi.find(BonneOffre);
        res.render('admin/dashboard.modification-emploi.hbs', {
            title: 'Modification Offre Emploi',
            message: req.flash('signupMessage'),
            isLog: req.user,
            item: offre,
        })
    })
});

//Modification offre emploi
router.post('/dashboard/modification-emploi/:id', isLoggedIn, function (req, res) {
    var mongoId = mongoose.Types.ObjectId(req.user._id);
    var emploiId = mongoose.Types.ObjectId(req.params.id);
    req.check('title', 'Le titre est vide').notEmpty();
    req.check('description', 'La description est vide').notEmpty();
    req.check('poste', 'Le titre du poste est vide').notEmpty();
    User.findOne(mongoId, function (err, model) { //Récupération de l'entreprise
        for (var i = 0; i < model.emploi.length; i++) { //Parcourir le tableau des offres d'emplois de l'entreprise
            if (model.emploi[i]._id == req.params.id) {
                model.emploi[i].title = req.body.title;
                model.emploi[i].description = req.body.description;
                model.emploi[i].poste = req.body.poste;
                model.save();
            }
        }
    });
    res.redirect("/dashboard/liste-emploi/");
});

//Suppression d'offre d'emploi
router.get('/dashboard/supprimer/emploi/:id', function (req, res, next) {
    var mongoId = mongoose.Types.ObjectId(req.user._id);
    var offreId = mongoose.Types.ObjectId(req.params.id);
    User.findOneAndUpdate({
            _id: mongoId
        }, {
            $pull: {
                emploi: {
                    _id: req.params.id
                }
            }
        },
        function (err, model) {
            console.log('Error: ' + model);
        }
    )
    res.redirect('/dashboard/liste-emploi/');
});

///// SI RESULTAT INTROUVABLE //////

router.post('/dashboard/contenu-magasin/logo', isLoggedIn, function (req, res) {
    mongoId = mongoose.Types.ObjectId(req.body.id);
    if (!req.files.logo) {

        req.session.errors = [{
            msg: "Vous n'avez pas mis d'image"
        }];
        req.session.success = false;

    } else {
        var sampleFile = req.files.logo;
        var fileName = req.body.companyNameSlug + '.' + sampleFile.name.split('.')[sampleFile.name.split('.').length - 1]
        sampleFile.name = fileName;
        upload('logo', sampleFile, req.session, mongoId);
        User.findById(mongoId, function (err, doc, logoName) {
            if (err) {
                return done(err);
            }
            doc.logo = fileName;
            doc.save();
        });
    }
    res.redirect('/dashboard/contenu-magasin')
});
router.post('/dashboard/contenu-magasin', isLoggedIn, function (req, res) {
    req.check('presentation', 'La présentation est vide').notEmpty();
    req.check('website', 'Le format du lien du site n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('facebook', 'Le format du lien facebook n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('twitter', 'Le format du lien twitter n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('instagram', 'Le format du lien instagram n\'est pas correct').optional({
        checkFalsy: true
    }).isURL();
    req.check('leftIndicator', 'Le positionnement horizontal doit être un chiffre').optional({
        checkFalsy: true
    }).isInt();
    req.check('rightIndicator', 'Le positionnement vertical doit être un chiffre').optional({
        checkFalsy: true
    }).isInt();
    req.check('leftIndicator', 'Le positionnement horizontal doit être compris entre 0 et 100').optional({
        checkFalsy: true
    }).isIntRange(0, 100);
    req.check('rightIndicator', 'Le positionnement vertical doit être compris entre 0 et 100').optional({
        checkFalsy: true
    }).isIntRange(0, 100);
    req.check('telephone', 'Le format du telephone n\'est pas correct').optional({
        checkFalsy: true
    }).isNumero();

    var errors = req.validationErrors();
    if (errors) {
        req.session.errors = errors;
        req.session.success = false;
    } else {
        User.findById(req.body.id, function (err, doc) {
            if (err) {
                return done(err);
            }
            doc.page.presentation = req.body.presentation;
            doc.page.address = req.body.address;
            doc.page.contact.website = req.body.website;
            doc.page.contact.facebook = req.body.facebook;
            doc.page.contact.twitter = req.body.twitter;
            doc.page.contact.instagram = req.body.instagram;
            doc.page.schedule = req.body.schedule;
            doc.leftIndicator = req.body.leftIndicator;
            doc.rightIndicator = req.body.rightIndicator;
            doc.page.contact.telephone = telephoneShape(req.body.telephone);

            doc.save();
        })
        req.session.success = true;
    }
    res.redirect("/dashboard/contenu-magasin");
});

router.get('/*', function (req, res, next) {
    User.find({
        isSuperAdmin: false
    }, function (err, user) {
        if (err)
            return done(err);
        else if (!user)
            res.render('E404', {
                title: 'Page Introuvable',
                message: 'Nous somme désolé mais la page que vous cherchez semble introuvable'
            });
        else
            res.render('E404', {
                title: 'Page Introuvable',
                message: 'Nous somme désolé mais la page que vous cherchez semble introuvable',
                entreprise: user,
                isLog: req.user
            });
    }).sort({
        companyName: 1
    })
});

/// Custom functions ///
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function isSuperAdmin(req, res, next) {
    isLoggedIn(req, res, function () {
        if (req.user.isSuperAdmin == true) {
            return next();
        } else {
            res.render('admin/dashboard.shopadmin-home.hbs', {
                title: 'Dashboard Magasin',
                isLog: req.user
            });
        }
    })
}

function telephoneShape(str) {
    var i = 0;
    var j = 0;
    str = str.replace(/[^0-9]/g, '');
    var formate = "";
    while (i < str.length) { //tant qu il y a des caracteres
        if (j < 2) {
            formate += str[i];
            j++;
            i++;
        } else { //si on a mis 2 chiffres a la suite on met un espace
            if (str[i] != ' ') {
                formate += " ";
            }
            j = 0;
        }
    }
    return formate;
}


function stringToSlug(str) {
    str = str.replace(/^\s+|\s+$/g, '');
    str = str.toLowerCase();
    var from = "àáäâèéëêìíïîòóöôùúüûñç·/_,:;";
    var to = "aaaaeeeeiiiioooouuuunc------";
    for (var i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }
    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
        .replace(/\s+/g, '-') // collapse whitespace and replace by -
        .replace(/-+/g, '-'); // collapse dashes
    return str;
}

//Affichage aléatoire des entreprises
function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue, randomIndex;

    // Tant qu'il reste des éléments à mélanger
    while (0 !== currentIndex) {

        // Prendre une entreprise restante
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // Et l'échanger avec l'élément courant
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

//Upload des images sur le site
function upload(localisation, file, session, mongoId) {
    let sampleFile = file;
    var imageName = sampleFile.name;
    var ext = sampleFile.name.split('.')[sampleFile.name.split('.').length - 1];

    console.log(sampleFile.name)
    if (ext != 'png' && ext != 'jpeg' && ext != 'jpg' && ext != 'PNG' && ext != 'JPEG' && ext != 'JPG') {
        session.errors = [{
            msg: "L'image doit être au format png ou jpg"
        }];
        session.success = false;
    } else {
        sampleFile.mv(path.join(__dirname, '../public/images/' + localisation + '/' + imageName));
        session.success = true;
    }
}

//Upload de la map et du background sur le site
function uploadSimple(file, session, name) {
    console.log(file);
    let sampleFile = file;
    var ext = path.extname(sampleFile.name);
    var imageName = name + ext;

    if (ext != '.png' && ext != '.jpeg' && ext != '.jpg' && ext != '.PNG' && ext != '.JPEG' && ext != '.JPG') {
        session.errors = [{
            msg: "L'image doit être au format png ou jpg"
        }];
        session.success = false;
    } else {
        sampleFile.mv(path.join(__dirname, '../public/images/map/' + imageName));
        session.success = true;
    }
}
module.exports = router;

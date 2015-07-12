(function (passportManager) {
    var passport = require("passport");
    var apiKeys = require("../secrets/api-keys");
    var localStrategy = require("passport-local").Strategy;
    
    passportManager.getPassport = function() { return passport };
    
    passportManager.init = function(app) {
        app.use(passport.initialize());
        app.use(passport.session());

        passport.serializeUser(function(user, done) {
            done(null, user.username);
        });
    
        // used to deserialize the user
        passport.deserializeUser(function(id, done) {
            done(null, {username: 'chris', email: apiKeys.adminUser});
        });
        
        passport.use('local-login', new localStrategy({
            // by default, local strategy uses username and password, we will override with email
            usernameField : 'email',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, email, password, done) { // callback with email and password from our form
    
                // if no user is found, return the message
                if (email != apiKeys.adminUser)
                    return done(null, false, req.flash('loginMessage', 'Invalid user')); // req.flash is the way to set flashdata using connect-flash
    
                // if the user is found but the password is wrong
                if (password != apiKeys.adminPassword)
                    return done(null, false, req.flash('loginMessage', 'Invalid password')); // create the loginMessage and save it to session as flashdata
    
                // all is well, return successful user
                return done(null, {username: 'chris', email: apiKeys.adminUser});
    
        }));
    };
    
    passportManager.apiIsLoggedIn = function(req, res, next) {
        // if user is authenticated in the session, carry on 
        if (req.isAuthenticated())
            return next();
    
        res.writeHead(403);
        res.end();
    };  

    
})(module.exports);
(function (homeController) {
    var googleApi = require("./googleBloggerApi");
    var passport = require("./passport");
    
    homeController.init = function(app) {
        
        app.get("/", function (req, res) {
            res.render("login", { title: "Virtual Walker Login"});
        });
            
        // process the login form
        app.post('/', passport.getPassport().authenticate('local-login', {
            successRedirect : '/googleAuth', // redirect to the secure profile section
            failureRedirect : '/', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));
        
        app.get("/googleAuth", isLoggedIn, function (req, res) {
            googleApi.startAuthorisation(req, res);
        });

        app.get("/home", isLoggedIn, function (req, res) {
            res.render("index", { title: "Virtual Walker Route Navigator"}); 
        });

        function isLoggedIn(req, res, next) {
        
            // if user is authenticated in the session, carry on 
            if (req.isAuthenticated())
                return next();
        
            // if they aren't redirect them to the home page
            res.redirect('/');
        }

    };
})(module.exports);
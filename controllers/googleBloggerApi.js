(function (googleApi) {
    var google = require("googleapis");
    var OAuth2 = google.auth.OAuth2;
    var apiKeys = require("../secrets/api-keys");

    var createNewAuth = function() {
        return new OAuth2(apiKeys.googleClientId, apiKeys.googleClientSecret, "http://virtualwalker-chrisballard.c9.io/oauth2callback");
    };
    
    googleApi.startAuthorisation = function(req, res) {
        // if(!req.session.oauth2Client) {
        //     var oauth2Client = createNewAuth();

        //     var url = oauth2Client.generateAuthUrl({
        //       access_type: 'online', // 'online' (default) or 'offline' (gets refresh_token)
        //       scope: 'https://www.googleapis.com/auth/blogger' // If you only need one scope you can pass it as string
        //     });
            
        //     console.log("Start auth. Redirect to: " + url);
            
        //     res.redirect(url);
        // } else {
            res.redirect("/home");
        // }
    };
    
    googleApi.completeAuthorisation = function(req, res, code, done) {
        var oauth2Client = createNewAuth();
        oauth2Client.getToken(code, function(err, tokens) {
          // Now tokens contains an access_token and an optional refresh_token. Save them.
          if(!err) {
              oauth2Client.setCredentials(tokens);
              req.session.oauth2Client = oauth2Client;
              console.log("Got " + tokens.length + " tokens");
          } else {
              console.log("Failed to authorise: " + err);
          }
          done();
        });        
    };
    
    googleApi.init = function(app) {
        
        app.get("/oauth2callback", function(req, res) {
            var code = req.query.code;
            console.log("Auth callback. Got code: " + code);
            googleApi.completeAuthorisation(req, res, code, function() {
                res.redirect("/home");    
            });
        });
        
        app.post("/postToBlog", function(req, res) {
            var title = req.body.title;
            var content = req.body.content;
            
            var blogger = google.blogger({version: 'v3'});
            var options = {
                blogId: 'thevirtualwalker.blogspot.com',
                resource: { blogId: 'thevirtualwalker.blogspot.com'  }
            };
            var x = blogger.blogs.get(options, function(err, body, res) {
                var test  = err;
            });

        });
    };
    
})(module.exports);
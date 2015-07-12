(function (controllers) {
    var passport = require("./passport");
    var homeController = require("./homeController");
    var mapsApi = require("./googleMapsApi");
    var streetviewApi = require("./googleStreetviewApi");
    var bloggerApi = require("./googleBloggerApi");
    var session = require("./session");
    var database = require("./database");
    
    controllers.init = function (app) {
        database.init();
        passport.init(app);

        homeController.init(app);
        mapsApi.init(app);
        streetviewApi.init(app);
        bloggerApi.init(app);
        session.init(app);
    };
    
})(module.exports);
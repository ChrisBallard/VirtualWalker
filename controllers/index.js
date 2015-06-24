(function (controllers) {
    
    var homeController = require("./homeController");
    var googleController = require("./googleController")
    
    controllers.init = function (app) {
        homeController.init(app);
        googleController.init(app);
    };
    
})(module.exports);
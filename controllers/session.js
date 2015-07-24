(function (sessCon) {
    var passport = require("./passport");
    var database = require("./database");
    var mapsApi = require("./googleMapsApi");
    var errors = require("./errorHandlers");
    var routing = require("../utilities/routing");
    
    sessCon.getSession = function(req) {
        if( !req || !req.session || !req.session.routeStr || req.session.curIndex==null || !req.session.route )
            return null;
        
        if(req.session.route.length <= 0)
            return null;
            
        if(req.session.curIndex < 0 || req.session.curIndex >= req.session.route.length)
            return null;
            
        return { routeStr: req.session.routeStr, route: req.session.route, curIndex: req.session.curIndex };
    };
    
    sessCon.updateSession = function(req, sessionData) {
        req.session.routeStr = sessionData.routeStr;
        req.session.route = sessionData.route;
        req.session.curIndex = sessionData.curIndex;
    };
    
    sessCon.init = function(app) {
        
        app.get("/usersession", passport.apiIsLoggedIn, function(req, res) {
            database.getSession(req.user.username,function(userSession) {
                res.json(userSession);
                res.end();
            });
        });
        
        app.post("/usersession", passport.apiIsLoggedIn, function(req, res) {
            database.saveSession(req.body,function(err) {
                if(err) {
                    errors.endWithError(res,err);
                } else {
                    res.end();
                }
            });
        });
        
        app.post("/startroute", passport.apiIsLoggedIn, function(req, res) {
            var newSession = { routeStr: req.body.points, curIndex: 0 };

            mapsApi.getRoute(newSession.routeStr, function(newRoute) {
                var obsPointsList = routing.parseRoute(newRoute);
                newSession.route = obsPointsList;
                sessCon.updateSession(req,newSession);
                res.end();
            });
        });
        
        app.post("/movenext", passport.apiIsLoggedIn, function(req, res) {
            var steps = req.query.steps || 1
            var sessionData = sessCon.getSession(req);
            if(!sessionData) {
                errors.endWithError(res, "No route defined. Enter and plan a route first");
                return;
            }
            if(sessionData.curIndex < sessionData.route.length-steps) {
                sessionData.curIndex += steps;
                sessCon.updateSession(req,sessionData);
            }
            res.end();
        });   
        
        app.post("/moveprev", passport.apiIsLoggedIn, function(req, res) {
            var steps = req.query.steps || 1
            var sessionData = sessCon.getSession(req);
            if(!sessionData) {
                errors.endWithError(res, "No route defined. Enter and plan a route first");
                return;
            }
            if(sessionData.curIndex > (steps-1)) {
                sessionData.curIndex-= steps;
                sessCon.updateSession(req,sessionData);
            }
            res.end();
        });       
        
    }
    
})(module.exports);
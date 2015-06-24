(function (googleController) {
    var http = require("http");
    var request = require("request");
    var routing = require("../utilities/routing");
    var geometry = require("../utilities/geometry");
    var apiKey = require("../secrets/api-keys").google;
    
    var routeDef = null;
    var route = null;
    var curIndex = 0;
    
    googleController.init = function(app) {
        
        app.get("/startroute", function(req, res) {
           routeDef = req.query.points;
           curIndex = 0;
           route = null;
           googleController.getRoute(routeDef, function(newRoute) {
               route = newRoute;
               res.end();
           });
        });
        
        app.get("/movenext", function(req, res) {
            if(curIndex < route.length-1) {
                curIndex++;
            }
            res.end();
        });   
        
        app.get("/moveprev", function(req, res) {
            if(curIndex > 0) {
                curIndex--;
            }
            res.end();
        });
        
        app.get("/google/streetview", function (req, res) {
            var obsPoint = route[curIndex];
            var urlPath = "/maps/api/streetview?" +
                "location=" + obsPoint.location.lat + "," + obsPoint.location.lng + "&" +
                "heading=" + obsPoint.forwardHeading + "&" +
                "fov=100&" +
                "pitch=0&" +
                "size=640x480&" +
                "sensor=false&" +
                "key="+apiKey;
        
            var options = {
                host: "maps.googleapis.com",
                path: urlPath
            };
        
            var callback = function(response) {
                if (response.statusCode === 200) {
                    res.writeHead(200, {
                        'Content-Type': response.headers['content-type']
                    });
                    response.pipe(res);
                } else {
                    res.writeHead(response.statusCode);
                    res.end();
                }
            };
        
            http.request(options, callback).end();
        });

        app.get("/google/routemap", function(req, res) {
            var obsPoint = route[curIndex];            
            var points = routeDef.split('|');
            var wayPoints = points.slice(1,points.length-1);
            var urlPath = "/maps/api/directions/json?" +
                "origin=" + points[0] + "&" +
                "destination=" + points[points.length-1] + "&" +
                (wayPoints.length>0 ? "waypoints=" + wayPoints.join('|') + "&" : "") +
                "mode=walking&" +
                "key="+apiKey;      
                
            request({
                uri: "https://maps.googleapis.com"+urlPath,
            }, function(error, response, body) {
                
                var route = JSON.parse(body);
                var routePoly = route.routes[0].overview_polyline.points;
                
                var mapsPath = "/maps/api/staticmap?" +
                    "size=640x480&" +
                    "path=color:0x0000ff80|weight:5|enc:"+routePoly+"&" +
                    "markers=color:blue|label:L|" + obsPoint.location.lat + "," + obsPoint.location.lng + "&" +
                    "key="+apiKey;
                    
                var options = {
                    host: "maps.googleapis.com",
                    path: mapsPath
                };
            
                var callback = function(response) {
                    if (response.statusCode === 200) {
                        res.writeHead(200, {
                            'Content-Type': response.headers['content-type']
                        });
                        response.pipe(res);
                    } else {
                        res.writeHead(response.statusCode);
                        res.end();
                    }
                };
            
                http.request(options, callback).end();
            });
            
            
            // google/route?points=51.575551,0.321448|51.636427,0.311492
            
        });
        
        app.get("/google/mapview", function(req, res) {
            
            //var urlPath
            res.end();
        });
    };
    
    googleController.getRoute = function(routeStr, done) {
        var points = routeStr.split('|');
        var wayPoints = points.slice(1,points.length-1);
        var urlPath = "/maps/api/directions/json?" +
            "origin=" + points[0] + "&" +
            "destination=" + points[points.length-1] + "&" +
            (wayPoints.length>0 ? "waypoints=" + wayPoints.join('|') + "&" : "") +
            "mode=walking&" +
            "key="+apiKey;      
            
        request({
            uri: "https://maps.googleapis.com"+urlPath,
        }, function(error, response, body) {
            
            var route = JSON.parse(body);
            
            var routeLegs = routing.startRoute();
            
            route.routes[0].legs.forEach(function(leg) {
            
                leg.steps.forEach(function(step) {
            
                    routeLegs = routing.addRouteSegment(step.polyline.points, routeLegs);
                });
            });
            
            var obsPointsList = routing.calculateObservationPoints(routeLegs, 0.5);

            done(obsPointsList);
        });
    };
    
})(module.exports);


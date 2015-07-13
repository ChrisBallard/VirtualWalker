(function(maps) {
    var config = require("../config").data();
    var errors = require("./errorHandlers");
    var imageManager = require("../utilities/imagemanager");
    var passport = require("./passport");
    var session = require("./session");
    var querystring = require("querystring");
    var web = require("../utilities/webrequest");

    // { points }
    function RouteDefinition(routeStr) {

        var parseLatLong = function(latLongStr) {
            var pair = latLongStr.split(',');
            if(pair.length != 2) {
                throw "Invalid lat/long pair: " + latLongStr;
            }
            var lat = parseFloat(pair[0]);
            var lng = parseFloat(pair[1]);
            if(isNaN(lat) || isNaN(lng)) {
                throw "Invalid lat/long pair: " + latLongStr;
            }
            return RouteDefinition.makeLatLong(lat,lng);
        };
        var pointStrs = routeStr.split('|');
        if( pointStrs.length < 2 ) {
            throw "Invalid route - needs at least two coordinate pairs";
        }
        this.points = pointStrs.map(function(point) { return parseLatLong(point) });
        this.hasWaypoints = function() {
            return this.points && this.points.length >= 2;
        };
        this.getWaypoints = function() {
            if( !this.hasWaypoints() ) {
                throw "Invalid route - needs at least two coordinate pairs";
            }      
            return this.points.slice(1,this.points.length-1).map(function(p) { return p.asString});
        };
        this.first = function() { return this.points[0].asString };
        this.last = function() { return this.points[this.points.length-1].asString };
    }
    
    RouteDefinition.makeLatLong = function(lat,lng) {
        return { lat: lat, lng: lng, asString: lat + "," + lng };
    };
    
    maps.getMapsClickUrl = function(routeDef) {
        var url = new web.Url("https", "www.google.com", 
            "/maps/dir/" + routeDef.first().toString() + "/" + routeDef.last().toString() + "/");
        return url;    
    };
    
    maps.getRouteUrl = function(routeDef) {
        var qsDef = { origin: routeDef.first(), destination: routeDef.last(), mode: 'walking', key: config.googleApiKey };
        if(routeDef.hasWaypoints()) { qsDef.waypoints = routeDef.getWaypoints().join('|') }
        var qs = querystring.stringify(qsDef);
        return new web.Url("https", "maps.googleapis.com", "/maps/api/directions/json?" + qs);
    };
    
    maps.getRouteMapUrl = function(routeDef, done) {
        var getRouteComplete = function(routeJson) {
            if( !routeJson ) {
                done("Route overview is missing or invalid. Unable to plan route?", null);
                return;
            }
            
            var routePoly = routeJson.routes[0].overview_polyline.points;
            var qs = querystring.stringify( {   size: "560x365", path: "color:0x0000ff80|weight:5|enc:"+routePoly,
                                                markers: "color:blue|label:L|" + routeDef.obsPoint.asString, key: config.googleApiKey });
            var mapsUrl = new web.Url("https", "maps.googleapis.com", "/maps/api/staticmap?" + qs);                
            done(null, mapsUrl);
        };
        
        getRouteInternal(routeDef, getRouteComplete);
    };
        
    var getRouteDefFromSession = function(req) {
        var sessionData = session.getSession(req);
        if(!sessionData) { return null }
        var routeDef = new RouteDefinition(sessionData.routeStr);
        routeDef.obsPoint = RouteDefinition.makeLatLong(sessionData.route[sessionData.curIndex].location.lat,sessionData.route[sessionData.curIndex].location.lng);
        return routeDef;
    };

    maps.getRoute = function(routeStr, done) {
        var routeDef = new RouteDefinition(routeStr);
        getRouteInternal(routeDef, done);
    };
    
    var getRouteInternal = function(routeDef, done) {
        var url = maps.getRouteUrl(routeDef);
        
        var gotRoute = function(err, response, routeJson) {
            if(!err) {
                if( !routeJson || !routeJson.routes || routeJson.routes.length <= 0 || !routeJson.routes[0].legs ) {
                    done(null);
                    return;
                }
                done(routeJson);
            } else {
                done(null);
            }
        };

        web.getJson(url, gotRoute);
    };
    
    maps.init = function(app) {
        app.get("/google/routemap/clickthrough", passport.apiIsLoggedIn, function (req, res) {
            var routeDef = getRouteDefFromSession(req);
            if(!routeDef) {
                errors.endWithError(res, "No route defined. Enter and plan a route first");
                return;
            }
           
            var url = maps.getMapsClickUrl(routeDef);
            web.shortenUrl(url, function(shortUrl) {
                if(shortUrl) {
                    res.json({ url: shortUrl});
                    res.end();
                } else {
                    console.log("Failed to make short url");
                    errors.endWithError(res, "Failed to make short url");
                }
            });
        });
        
        app.post("/google/routemap", passport.apiIsLoggedIn, function(req, res) {
            var routeDef = getRouteDefFromSession(req);
            if(!routeDef) {
                errors.endWithError(res, "No route defined. Enter and plan a route first");
                return;
            }
            
            var shortenDownloadedImage = function(err, imageId) {
                if(err) {
                    console.log("Failed to download map image");
                    errors.endWithError(res, "Failed to download map image");
                    return;
                }
                var fileUrl = "http://" + config.host + "/pics/" + imageId + ".jpg";
                web.shortenUrl(fileUrl, function(shortUrl) {
                    if(shortUrl) {
                        res.json({ url: shortUrl});
                        res.end();
                    } else {
                        console.log("Failed to make short url");
                        errors.endWithError(res, "Failed to make short url");
                    }
                });
            };
            
            var downloadRouteImage = function(err, mapsUrl) {
                if(err) {
                    errors.endWithError(res, err);
                    return;
                }
                imageManager.downloadToFile(mapsUrl.toString(), shortenDownloadedImage);
            };
            
            maps.getRouteMapUrl(routeDef, downloadRouteImage);
        });
        
        app.get("/google/routemap", passport.apiIsLoggedIn, function(req, res) {
            var routeDef = getRouteDefFromSession(req);
            if(!routeDef) {
                errors.endWithError(res, "No route defined. Enter and plan a route first");
                return;
            }
            
            var respondWithRouteImage = function(err, mapsUrl) {
                if(err) {
                    errors.endWithError(res, err);
                    return;
                }
                
                web.getResponse(mapsUrl, function(err, response) {
                    if (!err) {
                        res.writeHead(200, {
                            'Content-Type': response.headers['content-type']
                        });
                        response.pipe(res);
                    } else {
                        var errText = "Google Maps failed (" + err + ")";
                        errors.endWithError(res, errText);
                    }
                });
            };
            
            maps.getRouteMapUrl(routeDef, respondWithRouteImage);
        });
    };

})(module.exports);
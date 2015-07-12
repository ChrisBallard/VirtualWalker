(function (streetview) {
    var config = require("../config").data();
    var querystring = require("querystring");
    var geometry = require("../utilities/geometry");
    var imageManager = require("../utilities/imagemanager");
    var passport = require("./passport");
    var session = require("./session");
    var errors = require("./errorHandlers");
    var web = require("../utilities/webrequest");
    
    // { location{lat,lng}, heading, fov, pitch, size{width,height} }
    function StreetviewParams() {
        this.fov = 100;
        this.pitch = 0;
        this.formatSize = function() {
            return this.size.width + "x" + this.size.height;
        };
        this.formatLocation = function() {
            return this.location.lat + "," + this.location.lng;
        };
        this.parseSize = function(sizeStr) {
            var parts = sizeStr.split('x');
            if(!parts || parts.length != 2) {
                throw "Invalid size format";
            }
            this.size = { width: parseInt(parts[0],10), height: parseInt(parts[1],10) };
        };
        this.setHeading = function(heading, offsetType) {
            if(!offsetType || offsetType == "") {
                this.heading = heading;
                return;
            }
            switch(offsetType.toLocaleLowerCase())
            {
                case "front":
                    this.heading = heading;
                    break;
                case "left":
                    this.heading = geometry.offsetHeading(heading,-90);
                    break;
                case "right":
                    this.heading = geometry.offsetHeading(heading, 90);
                    break;
                case "rear":
                    this.heading = geometry.offsetHeading(heading, 180);
                    break;
                default:
                    throw "Unexpected offsetType: " + offsetType;
            }            
        };
    }
    
    streetview.getStreetviewUrl = function(params)  {
        var qs = querystring.stringify({    location: params.formatLocation(), heading: params.heading, fov: params.fov, pitch: params.pitch, 
                                            size: params.formatSize(), sensor: false, key: config.googleApiKey });
        var urlPath = new web.Url("https", "maps.googleapis.com", "/maps/api/streetview?" + qs);
        return urlPath;
    };
        
    streetview.getStreetviewClickUrl = function(params)  {
        // just a guess at mapping between field of view and maps url "zoom" param
        var zoom = params.fov >= 90 ? 0 : (params.fov >= 45 ? 1 : 2);
        
        var urlPath = new web.Url("http", "maps.google.com", "/maps?q=&layer=c&cbll=" + params.formatLocation() + "&" +
                            "cbp=11," + params.heading + ",0," + zoom + "," + params.pitch);
        return urlPath;
    };

    streetview.init = function(app) {
        app.get("/google/streetview", passport.apiIsLoggedIn, function (req, res) {
            var sessionData = session.getSession(req);
            if(!sessionData) {
                errors.endWithError(res, "No route defined. Enter and plan a route first");
                return;
            }
            
            var params = new StreetviewParams();
            params.parseSize(req.query.size);
            params.setHeading(sessionData.route[sessionData.curIndex].forwardHeading, req.query.dir);
            params.location = sessionData.route[sessionData.curIndex].location;
            var url = streetview.getStreetviewUrl(params);

            function callback(err, response) {
                if (!err) {
                    res.writeHead(200, {
                        'Content-Type': response.headers['content-type']
                    });
                    response.pipe(res);
                } else {
                    var errText = "Google Streetview failed (" + err + ")";
                    errors.endWithError(res, errText);
                }
            }
            
            web.getResponse(url, callback);
        });
        
        app.post("/google/streetview", passport.apiIsLoggedIn, function (req, res) {
            var sessionData = session.getSession(req);
            if(!sessionData) {
                errors.endWithError(res, "No route defined. Enter and plan a route first");
                return;
            }
            
            var params = new StreetviewParams();
            params.parseSize(req.query.size);
            params.setHeading(sessionData.route[sessionData.curIndex].heading, req.query.dir);
            params.location = sessionData.route[sessionData.curIndex].location;
            
            var url = streetview.getStreetviewUrl(params);
            imageManager.downloadToFile(url, function (err, imageId) {
                if(!err)
                {
                    var fileUrl = config.host + "/pics/" + imageId + ".jpg";
                    web.shortenUrl(fileUrl, function(shortUrl) {
                        if(shortUrl) {
                            res.json({url: shortUrl});
                            res.end();
                        } else {
                            console.log("Failed to make short url");
                            errors.endWithError(res, "Failed to make short url");
                        }
                    });
                }
                else
                {
                    console.log(err);
                    errors.endWithError(res, err);
                }
            });
        });
        
        app.get("/google/streetview/clickthrough", passport.apiIsLoggedIn, function (req, res) {
            var sessionData = session.getSession(req);
            if(!sessionData) {
                errors.endWithError(res, "No route defined. Enter and plan a route first");
                return;
            }
            
            var params = new StreetviewParams();
            params.parseSize(req.query.size);
            params.setHeading(sessionData.route[sessionData.curIndex].heading, req.query.dir);
            params.location = sessionData.route[sessionData.curIndex].location;

            var url = streetview.getStreetviewClickUrl(req.session, req.query.dir);
            web.shortenUrl(url, function(shortUrl) {
                if(shortUrl) {
                    res.json({url: shortUrl});
                    res.end();
                } else {
                    console.log("Failed to make short url");
                    errors.endWithError(res, "Failed to make short url");
                }
            });
        });
    };
})(module.exports);


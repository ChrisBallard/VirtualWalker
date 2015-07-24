// Generated by CoffeeScript 1.7.1
(function() {
  var config, errors, imageManager, passport, querystring, session, web;

  config = require("../config").data();

  errors = require("./errorHandlers");

  imageManager = require("../utilities/imagemanager");

  passport = require("./passport");

  session = require("./session");

  querystring = require("querystring");

  web = require("../utilities/webrequest");

  this.Coordinate = (function() {
    function Coordinate() {}

    Coordinate.prototype.contstructor = function(lat, lng) {
      var pair;
      this.lat = lat;
      this.lng = lng;
      if (typeof this.lat === "string") {
        pair = this.lat.split(',');
        if (pair.length !== 2) {
          throw "Invalid lat/long pair: " + this.lat;
        }
        this.lat = parseFloat(pair[0]);
        this.lng = parseFloat(pair[1]);
        if (isNaN(lat) || isNaN(lng)) {
          throw "Invalid lat/long pair: " + latLongStr;
        }
      }
    };

    Coordinate.prototype.toString = function() {
      return "" + this.lat + "," + this.lng;
    };

    return Coordinate;

  })();

  this.RouteDefinition = (function() {
    function RouteDefinition(routeStr) {
      var pointStrs;
      pointStrs = routeStr.split('|');
      if (pointStrs.length < 2) {
        throw "Invalid route - needs at least two coordinate pairs";
      }
      this.points = pointStrs.map(function(pointStr) {
        return new Coordinate(pointStr);
      });
    }

    RouteDefinition.prototype.hasWaypoints = function() {
      return (this.points != null) && this.points.length >= 2;
    };

    RouteDefinition.prototype.getWaypoints = function() {
      if (!this.hasWaypoints()) {
        throw "Invalid route - needs at least two coordinate pairs";
      }
      return (this.points.slice(1, this.points.length - 1)).map(function(p) {
        return p.toString();
      });
    };

    RouteDefinition.prototype.first = function() {
      return this.points[0].toString();
    };

    RouteDefinition.prototype.last = function() {
      return this.points[this.points.length - 1].toString();
    };

    return RouteDefinition;

  })();

  this.getMapsClickUrl = function(routeDef) {
    return new web.Url("https", "www.google.com", "/maps/dir/" + (routeDef.first().toString()) + "/" + (routeDef.last().toString()) + "/");
  };

  this.getRouteUrl = function(routeDef) {
    var qs, qsDef;
    qsDef = {
      origin: routeDef.first(),
      destination: routeDef.last(),
      mode: 'walking',
      key: config.googleApiKey
    };
    if (routeDef.hasWaypoints()) {
      qsDef.waypoints = routeDef.getWaypoints().join('|');
    }
    qs = querystring.stringify(qsDef);
    return new web.Url("https", "maps.googleapis.com", "/maps/api/directions/json?" + qs);
  };

  this.getRouteMapUrl = function(routeDef, done) {
    var getRouteComplete;
    getRouteComplete = function(routeJson) {
      var mapsUrl, qs, routePoly;
      if (routeJson == null) {
        done("Route overview is missing or invalid. Unable to plan route?", null);
        return;
      }
      routePoly = routeJson.routes[0].overview_polyline.points;
      qs = querystring.stringify({
        size: "560x365",
        path: "color:0x0000ff80|weight:5|enc:" + routePoly,
        markers: "color:blue|label:L|" + (routeDef.obsPoint.toString()),
        key: config.googleApiKey
      });
      mapsUrl = new web.Url("https", "maps.googleapis.com", "/maps/api/staticmap?" + qs);
      return done(null, mapsUrl);
    };
    return this.getRouteInternal(routeDef, getRouteComplete);
  };

  this.getRouteDefFromSession = function(req) {
    var routeDef, sessionData;
    sessionData = session.getSession(req);
    if (!sessionData) {
      return null;
    }
    routeDef = new this.RouteDefinition(sessionData.routeStr);
    routeDef.obsPoint = new this.Coordinate(sessionData.route[sessionData.curIndex].location.lat, sessionData.route[sessionData.curIndex].location.lng);
    return routeDef;
  };

  this.getRoute = function(routeStr, done) {
    var routeDef;
    routeDef = new this.RouteDefinition(routeStr);
    return this.getRouteInternal(routeDef, done);
  };

  this.getRouteInternal = function(routeDef, done) {
    var gotRoute, url;
    url = this.getRouteUrl(routeDef);
    gotRoute = function(err, response, routeJson) {
      if (!err) {
        if (!routeJson || !routeJson.routes || routeJson.routes.length <= 0 || !routeJson.routes[0].legs) {
          return done(null);
        } else {
          return done(routeJson);
        }
      } else {
        return done(null);
      }
    };
    return web.getJson(url, gotRoute);
  };

  this.init = function(app) {
    app.get("/google/routemap/clickthrough", passport.apiIsLoggedIn, function(req, res) {
      var routeDef, url;
      routeDef = getRouteDefFromSession(req);
      if (routeDef == null) {
        return errors.endWithError(res, "No route defined. Enter and plan a route first");
      } else {
        url = this.getMapsClickUrl(routeDef);
        return web.shortenUrl(url, function(shortUrl) {
          if (shortUrl != null) {
            res.json({
              url: shortUrl
            });
            return res.end();
          } else {
            console.log("Failed to make short url");
            return errors.endWithError(res, "Failed to make short url");
          }
        });
      }
    });
    app.post("/google/routemap", passport.apiIsLoggedIn, function(req, res) {
      var downloadRouteImage, routeDef, shortenDownloadedImage;
      routeDef = getRouteDefFromSession(req);
      if (!(typeof routeDef === "function" ? routeDef(errors.endWithError(res, "No route defined. Enter and plan a route first")) : void 0)) {

      } else {
        shortenDownloadedImage = function(err, imageId) {
          var fileUrl;
          if (err != null) {
            console.log("Failed to download map image");
            return errors.endWithError(res, "Failed to download map image");
          } else {
            fileUrl = "http://" + config.host + "/pics/" + imageId + ".jpg";
            return web.shortenUrl(fileUrl, function(shortUrl) {
              if (shortUrl != null) {
                res.json({
                  url: shortUrl
                });
                return res.end();
              } else {
                console.log("Failed to make short url");
                return errors.endWithError(res, "Failed to make short url");
              }
            });
          }
        };
        downloadRouteImage = function(err, mapsUrl) {
          if (err != null) {
            return errors.endWithError(res, err);
          } else {
            return imageManager.downloadToFile(mapsUrl.toString(), shortenDownloadedImage);
          }
        };
        return this.getRouteMapUrl(routeDef, downloadRouteImage);
      }
    });
    return app.get("/google/routemap", passport.apiIsLoggedIn, function(req, res) {
      var respondWithRouteImage, routeDef;
      routeDef = getRouteDefFromSession(req);
      if (!(typeof routeDef === "function" ? routeDef(errors.endWithError(res, "No route defined. Enter and plan a route first")) : void 0)) {

      } else {
        respondWithRouteImage = function(err, mapsUrl) {
          if (err != null) {
            return errors.endWithError(res, err);
          } else {
            return web.getResponse(mapsUrl, function(err, response) {
              if (err == null) {
                res.writeHead(200, {
                  'Content-Type': response.headers['content-type']
                });
                return response.pipe(res);
              } else {
                return errors.endWithError(res, "Google Maps failed (" + err + ")");
              }
            });
          }
        };
        return this.getRouteMapUrl(routeDef, respondWithRouteImage);
      }
    });
  };

}).call(this);

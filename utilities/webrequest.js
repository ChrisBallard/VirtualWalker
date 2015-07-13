(function(web) {
    var http = require("http")
    var request = require("request");
    var querystring = require("querystring");
    var config = require("../config").data();
    
    web.Url = function(protocol, host, path) {
        this.protocol = protocol;
        this.host = host;
        this.path = path;
        this.toString = function() {
            return this.protocol + "://" + this.host + this.path;
        };
    };
    
    var parseRespForErr = function(response) {
        if(response.statusCode >= 500) {
            return "Server error " + response.statusCode;
        } else if(response.statusCode == 400) {
            return "Bad request";
        } else if(response.statusCode == 401) {
            return "Unauthorized";
        } else if(response.statusCode == 403) {
            return "Forbidden";
        } else if(response.statusCode == 404) {
            return "Not found";
        } else if(response.statusCode == 407) {
            return "Proxy authentication required";
        } else if(response.statusCode > 400) {
            return "Client error "+ response.statusCode;
        } else {
            return null;
        } 
    };
    
    web.getJson = function(url, completion) {
        request(url.toString(), function(err, response, body){
            var outerErr = parseRespForErr(response);
            if(outerErr || err) {
                completion(outerErr + "[" + err + "]", response, null);
            } else {
                completion(null, response, JSON.parse(response.body));
            }
        });
    };
    
    web.getResponse = function(url, completion) {
        var options = {
            host: url.host,
            path: url.path
        };
    
        var callback = function(response) {
            var outerErr = parseRespForErr(response);
            if(outerErr) {
                completion(outerErr, response);
            } else {
                completion(null, response);
            } 
        };
    
        http.request(options, callback).end();        
    };
    
    web.shortenUrl = function(url, done) {
        var qs = querystring.stringify({ longUrl: url.toString(), apiKey: config.shortenerKey });
        var shortenerUrl = new web.Url("http", config.shortener, "/admin/api/add?" + qs);
        var doneShortening = function(err, response, resJson) {
            if(!err) {
                if(!resJson || !resJson.shortUrl) {
                    done(null);
                    return;
                }
                done(resJson.shortUrl);
            } else {
                done(null);
            }
        };
        web.getJson(shortenerUrl, doneShortening);
    };
    
    
})(module.exports);
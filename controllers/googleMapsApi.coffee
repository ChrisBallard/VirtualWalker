config = require("../config").data()
errors = require "./errorHandlers"
imageManager = require "../utilities/imagemanager"
passport = require "./passport"
session = require "./session"
querystring = require "querystring"
web = require "../utilities/webrequest"

class @Coordinate
    contstructor: (@lat, @lng) ->
        if typeof @lat is "string"      # effectively an overload
            pair = @lat.split ','
            if pair.length != 2 then throw "Invalid lat/long pair: #{@lat}"
            
            @lat = parseFloat pair[0]
            @lng = parseFloat pair[1]
            if isNaN(lat) || isNaN(lng) then throw "Invalid lat/long pair: #{latLongStr}"
    
    toString: () -> "#{@lat},#{@lng}"

class @RouteDefinition
    constructor: (routeStr) ->
        pointStrs = routeStr.split('|');
        if pointStrs.length < 2 then throw "Invalid route - needs at least two coordinate pairs"
        @points = pointStrs.map (pointStr) -> new Coordinate(pointStr)

    hasWaypoints: () -> @points? && @points.length >= 2
    
    getWaypoints: () ->
        unless @hasWaypoints() then throw "Invalid route - needs at least two coordinate pairs"
        (@points.slice 1, @points.length-1).map (p) -> p.toString()
    
    first: () -> @points[0].toString()
    last: () -> @points[@points.length-1].toString()


@getMapsClickUrl = (routeDef) ->
    new web.Url("https", "www.google.com", 
                "/maps/dir/#{routeDef.first().toString()}/#{routeDef.last().toString()}/")

@getRouteUrl = (routeDef) ->
    qsDef = { origin: routeDef.first(), destination: routeDef.last(), mode: 'walking', key: config.googleApiKey }
    if routeDef.hasWaypoints() then qsDef.waypoints = routeDef.getWaypoints().join('|')
    qs = querystring.stringify qsDef
    new web.Url("https", "maps.googleapis.com", "/maps/api/directions/json?#{qs}")

@getRouteMapUrl = (routeDef, done) ->
    getRouteComplete = (routeJson) ->
        unless routeJson?
            done("Route overview is missing or invalid. Unable to plan route?", null)
            return
        
        routePoly = routeJson.routes[0].overview_polyline.points;
        qs = querystring.stringify
            size: "560x365"
            path: "color:0x0000ff80|weight:5|enc:#{routePoly}"
            markers: "color:blue|label:L|#{routeDef.obsPoint.toString()}"
            key: config.googleApiKey
        mapsUrl = new web.Url("https", "maps.googleapis.com", "/maps/api/staticmap?#{qs}")                
        done null, mapsUrl
    
    @getRouteInternal routeDef, getRouteComplete
    
@getRouteDefFromSession = (req) ->
    sessionData = session.getSession req
    unless sessionData then return null
    routeDef = new @RouteDefinition sessionData.routeStr
    routeDef.obsPoint = new @Coordinate(sessionData.route[sessionData.curIndex].location.lat,sessionData.route[sessionData.curIndex].location.lng)
    routeDef

@getRoute = (routeStr, done) ->
    routeDef = new @RouteDefinition(routeStr)
    @getRouteInternal routeDef, done

@getRouteInternal = (routeDef, done) ->
    url = @getRouteUrl routeDef
    
    gotRoute = (err, response, routeJson) ->
        unless err
            if !routeJson || !routeJson.routes || routeJson.routes.length <= 0 || !routeJson.routes[0].legs 
                done null
            else done routeJson
        else done null

    web.getJson url, gotRoute

@init = (app) ->
    app.get "/google/routemap/clickthrough", passport.apiIsLoggedIn, (req, res) ->
        routeDef = getRouteDefFromSession req
        unless routeDef? then errors.endWithError res, "No route defined. Enter and plan a route first"
        else
            url = @getMapsClickUrl routeDef
            web.shortenUrl url, (shortUrl) ->
                if shortUrl?
                    res.json { url: shortUrl}
                    res.end()
                else
                    console.log "Failed to make short url"
                    errors.endWithError res, "Failed to make short url"

    app.post "/google/routemap", passport.apiIsLoggedIn, (req, res) ->
        routeDef = getRouteDefFromSession req
        unless routeDef? errors.endWithError res, "No route defined. Enter and plan a route first"
        else
            shortenDownloadedImage = (err, imageId) ->
                if err?
                    console.log "Failed to download map image"
                    errors.endWithError res, "Failed to download map image"
                else
                    fileUrl = "http://#{config.host}/pics/#{imageId}.jpg"
                    web.shortenUrl fileUrl, (shortUrl) ->
                        if shortUrl?
                            res.json { url: shortUrl}
                            res.end()
                        else
                            console.log "Failed to make short url"
                            errors.endWithError res, "Failed to make short url"

            downloadRouteImage = (err, mapsUrl) ->
                if err? then errors.endWithError res, err
                else
                    imageManager.downloadToFile mapsUrl.toString(), shortenDownloadedImage

            @getRouteMapUrl routeDef, downloadRouteImage

    app.get "/google/routemap", passport.apiIsLoggedIn, (req,res) ->
        routeDef = getRouteDefFromSession req
        unless routeDef? errors.endWithError res, "No route defined. Enter and plan a route first"
        else
            respondWithRouteImage = (err, mapsUrl) ->
                if err? then errors.endWithError res, err
                else
                    web.getResponse mapsUrl, (err, response) ->
                        unless err?
                            res.writeHead 200,
                                'Content-Type': response.headers['content-type']
                            response.pipe res
                        else errors.endWithError res, "Google Maps failed (#{err})"

            @getRouteMapUrl routeDef, respondWithRouteImage

http = require "http"
request = require "request"
querystring = require "querystring"
config = require("../config").data()

class @Url 
    constructor: (@protocol, @host, @path) ->
    toString: () => "#{@protocol}://#{@host}#{@path}"

parseRespForErr = (response) ->
    return switch
        when response.statusCode >= 500 then "Server error #{response.statusCode}"
        when response.statusCode == 400 then "Bad request"
        when response.statusCode == 401 then "Unauthorized"
        when response.statusCode == 403 then "Forbidden"
        when response.statusCode == 404 then "Not found"
        when response.statusCode == 407 then "Proxy authentication required"
        when response.statusCode > 400 then "Client error #{response.statusCode}"
        else null

@getJson = (url, completion) ->
    callback = (err, response, body) =>
        outerErr = parseRespForErr response
        if (outerErr? || err?) then completion "#{outerErr}[#{err}]", response, null
        else completion null, response, (JSON.parse response.body)
    request url.toString(), callback

@getResponse = (url, completion) ->
    options = 
        host: url.host
        path: url.path

    callback = (response) =>
        outerErr = parseRespForErr response
        if outerErr? then completion outerErr, response
        else completion null, response

    http.request(options, callback).end()     

@shortenUrl = (url, done) ->
    qs = querystring.stringify (longUrl: url.toString(), apiKey: config.shortenerKey)
    shortenerUrl = new web.Url "http", config.shortener, "/admin/api/add?#{qs}"
    doneShortening = (err, response, resJson) =>
        unless err?
            if !resJson || !resJson.shortUrl then done null
            else done resJson.shortUrl
        else done null
    this.getJson shortenerUrl, doneShortening


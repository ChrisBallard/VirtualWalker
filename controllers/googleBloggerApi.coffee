config = require("../config").data()
google = require "googleapis"
OAuth2 = google.auth.OAuth2
apiKeys = require "../secrets/api-keys"

createNewAuth = () ->
    callbackUrl = "http://virtualwalker-chrisballard.c9.io/oauth2callback"
    new OAuth2(apiKeys.googleClientId, apiKeys.googleClientSecret, callbackUrl)

@startAuthorisation = (req, res) ->
    unless config.skipGoogleAuth || req.session.oauth2Client?
        oauth2Client = createNewAuth()
    
        url = oauth2Client.generateAuthUrl
          access_type: "online"                              # 'online' (default) or 'offline' (gets refresh_token)
          scope: "https://www.googleapis.com/auth/blogger"   # If you only need one scope you can pass it as string

        console.log "Start auth. Redirect to: #{url}"
        res.redirect url
    else
        res.redirect "/home"

@completeAuthorisation = (req, res, code, done) ->
    oauth2Client = createNewAuth()
    oauth2Client.getToken code, (err, tokens) ->
        # Now tokens contains an access_token and an optional refresh_token. Save them.
        unless err?
            oauth2Client.setCredentials tokens
            req.session.oauth2Client = oauth2Client
            console.log "Got #{tokens.length} tokens"
        else
            console.log "Failed to authorise: #{err}"
    done()
    null

@init = (app) ->
    app.get "/oauth2callback", (req, res) ->
        code = req.query.code;
        console.log "Auth callback. Got code: #{code}"
        googleApi.completeAuthorisation req, res, code, () => res.redirect "/home"

    app.post "/postToBlog", (req, res) ->
        title = req.body.title
        content = req.body.content
        
        blogger = google.blogger {version: 'v3'}
        options
            blogId: 'thevirtualwalker.blogspot.com'
            resource: { blogId: 'thevirtualwalker.blogspot.com' }
        
        x = blogger.blogs.get options, (err, body, res) ->
            test  = err;

config = require("../config").data()
mongoose = require "mongoose"
UserWaypoint = null
UserSession = null

@getSession = (username,done) ->
    UserSession.findOne { userName: username}, (err,userSession) =>
        if err? || !userSession? then done { userName: username } # new session
        else done userSession

@saveSession = (userSession,done) ->
    UserSession.findOne { userName: userSession.userName}, (err,existingSession) =>
        if err? || !existingSession? then existingSession = new UserSession(userSession)
        else existingSession.blogText = userSession.blogText

        existingSession.save (err,obj) => if err? then done(err) else done(null)


@init = () ->
    mongoose.connect config.mongo
    
    UserWaypoint = mongoose.model 'UserWaypoint', 
        userName:
            type: String
            required: true
            unique: true
        milesSoFar:
            type: Number
            required: true
        lastCoord:
            type: String
            required: true

    UserSession = mongoose.model 'UserSession',
        userName:
            type: String
            required: true
            unique: true
        blogText:
            type: String
            required: false
        route:
            type: String
            required: false
        stepsToday:
            type: Number
            required: false
        milesToday:
            type: Number
            required: false
        walkingDate:
            type: Date
            required: false

    null

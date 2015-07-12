(function(database) {
    var mongoose = require("mongoose");
    var UserWaypoint = null;
    var UserSession = null;
    
    database.getSession = function(username,done) {
        UserSession.findOne({ userName: username}, function(err,userSession) {
            if(err || !userSession) {
                done({ userName: username });
            } else {
                done(userSession);
            } 
        });
    };
    
    database.saveSession = function(userSession,done) {
        UserSession.findOne({ userName: userSession.userName}, function(err,existingSession) {
            if(err || !existingSession) {
                existingSession = new UserSession(userSession);
            } else {
                existingSession.blogText = userSession.blogText;
            }
            existingSession.save(function(err,obj) {
                if(err) {
                    done(err);
                } else {
                    done(null);
                }
            });
        });
    };
    
    database.init = function() {
        mongoose.connect('mongodb://' + process.env.IP + '/virtualwalker');
        
        UserWaypoint = mongoose.model('UserWaypoint', {
            userName: {
                type: String,
                required: true,
                unique: true
            },
            milesSoFar: {
                type: Number,
                required: true
            },
            lastCoord: {
                type: String,
                required: true
            }
        });      
        
        UserSession = mongoose.model('UserSession', {
            userName: {
                type: String,
                required: true,
                unique: true
            },
            blogText: {
                type: String,
                required: false
            },
            route: {
                type: String,
                required: false
            },
            stepsToday: {
                type: Number,
                required: false
            },
            milesToday: {
                type: Number,
                required: false
            },
            walkingDate: {
                type: Date,
                required: false
            }
        });
    }
    
})(module.exports);
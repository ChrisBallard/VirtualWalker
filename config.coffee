secrets = require "./secrets/api-keys"
    
dev =
    mongo: "mongodb://#{process.env.IP}/virtualwalker"
    port: process.env.PORT
    host: "virtualwalker-chrisballard.c9.io"
    shortener: "shortener-chrisballard.c9.io"
    shortenerKey: secrets.shortenerDev
    googleApiKey: secrets.google
    sessionSecret: secrets.session
    skipGoogleAuth: true
    
prod =
    mongo: "mongodb://127.0.0.1:27017/virtualwalker"
    port: 8003
    host: "tvw.chrsb.co"
    shortener: "chrsb.co"
    shortenerKey: secrets.shortenerProd
    googleApiKey: secrets.google
    sessionSecret: secrets.session
    skipGoogleAuth: false

cacheData = null;
    
@data = () =>
    unless cacheData?
        env = process.argv[2];
        unless env?
            console.log "Missing environment on command line: use 'dev' or 'prod' - defaulting to dev"
            env = "dev"
        cacheData = switch env.toLocaleLowerCase()
            when "dev" then dev
            when "prod" then prod
            else
                console.log "Invalid environment name: #{env}"
                process.exit 2
    cacheData

(function (config) {
    var secrets = require("./secrets/api-keys");
    
    var dev = { 
        mongo: "mongodb://" + process.env.IP + "/virtualwalker",
        port: process.env.PORT,
        host: "virtualwalker-chrisballard.c9.io",
        shortener: "shortener-chrisballard.c9.io",
        shortenerKey: secrets.shortenerDev,
        googleApiKey: secrets.google,
        sessionSecret: secrets.session
    };
    
    var prod = {
        mongo: "mongodb://127.0.0.1:27017/virtualwalker",
        port: 8003,
        host: "tvw.chrsb.co",
        shortener: "chrsb.co",
        shortenerKey: secrets.shortenerProd,
        googleApiKey: secrets.google,
        sessionSecret: secrets.session
    };
    
    var cacheData = null;
    
    config.data = function() {
        if(!cacheData) {
            var env = process.argv[2];
            if( !env ) {
                console.log("Missing environment on command line: use 'dev' or 'prod'");
                process.exit(1);
            }
            switch(env.toLocaleLowerCase()) {
                case "dev":
                    cacheData = dev;
                    break;
                case "prod":
                    cacheData = prod;
                    break;
                default:
                    console.log("Invalid environment name: " + env);
                    process.exit(2);
            }
        }
        return cacheData;
    };

    
})(module.exports);
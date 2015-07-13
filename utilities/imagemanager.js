(function (imagemanager) {
    var htrq = require("http-request");
    var path = require("path");
    var fs = require("fs");
    
    imagemanager.downloadToFile = function(url,completion) {
        var options = {url: url.toString()};
        
        var dir = path.join(__dirname, '../public/pics/');
        var imageId = 0;
        
        do {
            imageId = Math.floor(Math.random() * 10000000000);
            var name = dir + imageId + ".jpg";
        } while( fs.existsSync(name) );
        
        htrq.get(options, name, function (error, result) {
            if (error) {
                completion(error, null);
            } else {
                completion(null, imageId);
            }
        });
    };
    
})(module.exports);
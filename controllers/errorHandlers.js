(function(errors) {
    
    errors.endWithError = function(res, err) {
        var errText = err.message ? err.message : err;
        res.writeHead(500, {'Error-Text': errText});
        res.end();
    };

})(module.exports);
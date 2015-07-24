@endWithError = (res, err) ->
    errText = err.message ?  err
    res.writeHead 500, {'Error-Text': errText}
    res.end()


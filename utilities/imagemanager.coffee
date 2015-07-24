htrq = require "http-request"
path = require "path"
fs = require "fs"

@downloadToFile = (url,completion) ->
    options = (url: url.toString())
    
    dir = path.join(__dirname, "../public/pics/")
    imageId = 0;
    
    getRandomFilename = () ->
        imageId = Math.floor(Math.random() * 10000000000)
        "#{dir}#{imageId}.jpg"
        
    name = getRandomFilename()
    while fs.existsSync(name) 
        name = getRandomFilename()
    
    htrq.get options, name, (error, result) =>
        if error? then completion(error, null)
        else completion(null, imageId)

var http = require("http");
var express = require("express");
var path = require("path");
var app = express();
var passport = require("passport");
var flash = require("connect-flash");
var morgan = require("morgan");
var cookieParser = require("cookie-parser");
var session = require("express-session");
var controllers = require("./controllers");

app.use(morgan('dev'));
app.set("view engine", "jade");
app.use(express.static(path.join(__dirname, 'public')));

controllers.init(app);

var server = http.createServer(app);

server.listen(process.env.PORT);


// sample page: google/streetview?location=51.390755,-3.276851&heading=220&fov=60&size=640x480

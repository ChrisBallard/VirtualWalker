var config = require("./config").data();
var http = require("http");
var express = require("express");
var path = require("path");
var app = express();
var flash = require("connect-flash");
var morgan = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var session = require("express-session");
var controllers = require("./controllers");
var apiKeys = require("./secrets/api-keys");

app.use(morgan('dev'));

app.use(cookieParser());
app.use(bodyParser());
app.use(session({secret: apiKeys.sessionSecret}));

app.set("view engine", "jade");
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());

controllers.init(app);

var server = http.createServer(app);
server.listen(config.port);

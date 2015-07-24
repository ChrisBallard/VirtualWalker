config = require("./config").data()
http = require "http"
express = require "express"
path = require "path"
app = express()
flash = require "connect-flash"
morgan = require "morgan"
cookieParser = require "cookie-parser"
bodyParser = require "body-parser"
session = require "express-session"
controllers = require "./controllers"
apiKeys = require "./secrets/api-keys"

app.use(morgan "dev")

app.use(cookieParser())
app.use(bodyParser())
app.use(session(secret: apiKeys.sessionSecret))

app.set "view engine", "jade"
app.use(express.static(path.join(__dirname, "public")))
app.use(flash())

controllers.init app

server = http.createServer app
server.listen config.port

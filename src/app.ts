import "dotenv/config";
import express, { Application, Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import "ejs";
import expressLayouts from "express-ejs-layouts";
import expressSession, { SessionData } from "express-session";
import bodyParser from "body-parser";
import createError from "http-errors";
import debugLib from "debug";
import { logger } from "./logger";
import http from "http";
import morgan from "morgan";
import passport from "passport";
import indexRouter from "./routes/index";
import "./strategies/local.strategy";
import "./strategies/discord.strategy";
import mongoStore from "connect-mongo";
import { Database } from "./database/mongodb.database";
import mongoose from "mongoose";
import flash from "express-flash";
import methodOverride from "method-override";
const app: Application = express();

// Initial db connection on app start
Database._connect();

// Ejs config
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/index");

app.use(expressLayouts);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/public")));
app.use("**/assets", express.static(path.join(__dirname, "/public/assets")));
app.use("**/utils", express.static(path.join(__dirname, "/public/utils")));

// Session config
declare module "express-session" {
  interface SessionData {
    userId: string;
    username: string;
    email: string;
  }
}

app.use(
  expressSession({
    secret: `${process.env.SECRET_KEY}`,
    saveUninitialized: false,
    resave: false,
    store: mongoStore.create({
      mongoUrl: `${process.env.MONGO_URI}`,
    }),
  })
);

// Passport config
app.use(passport.initialize());
app.use(passport.session());

// Display messages during authentication responses
app.use(flash());

// Method override
app.use(methodOverride("_method"));

// Morgan HTTP logger
app.use(morgan("dev"));

// Index routing
app.use("/", indexRouter);

// Start the server if db connection is established
mongoose.connection.once("open", () => {
  // Server configs
  app.use(function (req: Request, res: Response, next: NextFunction) {
    next(createError(404));
  });

  app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    res.status(err.status || 500);
    res.render("error");
  });

  const debug = debugLib("node_app:server");

  var port = normalizePort(process.env.PORT || "3000");
  app.set("port", port);

  var server = http.createServer(app);

  server.listen(port, () => logger.info("Server running on port: " + port));
  server.on("error", onError);
  server.on("listening", onListening);

  function normalizePort(val: any) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
      return val;
    }

    if (port >= 0) {
      return port;
    }

    return false;
  }

  function onError(error: any) {
    if (error.syscall !== "listen") {
      throw error;
    }

    var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

    switch (error.code) {
      case "EACCES":
        console.error(bind + " requires elevated privileges");
        process.exit(1);
        break;
      case "EADDRINUSE":
        console.error(bind + " is already in use");
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  function onListening() {
    var addr = server.address();
    var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr!.port;
    debug("Listening on " + bind);
  }
});

// Close all connections if the app is exited
process
  .on("SIGINT", Database.gracefulExit)
  .on("SIGTERM", Database.gracefulExit);

export default app;

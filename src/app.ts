import "dotenv/config";
import "ejs";
import express, { Application, Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import expressLayouts from "express-ejs-layouts";
import expressSession, { Session } from "express-session";
import bodyParser from "body-parser";
import createError from "http-errors";
import debugLib from "debug";
import { logger } from "./logger";
import http from "http";
import morgan from "morgan";
import passport, { session } from "passport";
import indexRouter from "./routes/index";
import "./strategies/local.strategy";
import "./strategies/discord.strategy";
import mongoStore from "connect-mongo";
import { Database } from "./database/mongodb.database";
import mongoose from "mongoose";
import flash from "express-flash";
import methodOverride from "method-override";
import "redis";
import { Server } from "socket.io";
import "socket.io-client";
// import { RedisClient } from "./database/redis.database";
import { instrument } from "@socket.io/admin-ui";
import { sessions } from "./database/schemas/sessions.schema";
import { localUserModel } from "./database/schemas/local_user.schema";
import { ChatController } from "./controllers/chat.controller";
import { FriendshipController } from "./controllers/friendship.controller";
import { LocalUsersController } from "./controllers/local_users.controller";
const app: Application = express();

declare module "express-session" {
    interface SessionData {
        userId: string;
        username: string;
        email: string;
    }
}

declare module "http" {
    interface IncomingMessage {
        session: Session & {
            authenticated: boolean
        }
    }
}

// Initial db connection on app start
Database._connect();

// Redis connection on app start
// RedisClient._connect();

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
let expressSessionMiddleware = expressSession({
    secret: `${process.env.SECRET_KEY}`,
    saveUninitialized: false,
    resave: false,
    store: mongoStore.create({
        mongoUrl: `${process.env.MONGO_URI}`,
    }),
})

app.use(expressSessionMiddleware);

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
    var local_server = `${process.env.LOCAL_SERVER}`;
    var admin_url = `${process.env.SOCKET_IO_ADMIN_URL}`;

    const io = new Server(server, {
        cors: {
            origin: [local_server, admin_url],
            credentials: true
        },
    });

    io.engine.use(expressSessionMiddleware);

    instrument(io, { auth: false });

    io.use((socket, next) => {
        expressSessionMiddleware(socket.request as Request, {} as Response, next as NextFunction);
    });

    io.use(async (socket, next) => {
        const sessionID = socket.request.session.id;
        if (sessionID) {
            const result = await sessions.findOne({
                _id: sessionID,
            })
            if (result) {
                let session = result.session;
                let parsedSession = JSON.parse(session);
                let userID = parsedSession.passport.user;
                const user = await localUserModel.findOne({
                    _id: userID,
                })
                if (user) {
                    socket.data.sessionID = sessionID;
                    socket.data.userID = userID;
                    socket.data.username = user?.username;
                    return next();
                }
                else throw new Error("No user found during SocketIO session search");
            }
        } else throw new Error("No sessionID found");
    })

    io.on("connection", (socket) => {
        logger.info(`A user(${socket.id}) has connected`);
        socket.on("disconnect", () =>
            logger.info(`User(${socket.id}) has disconnected`)
        );
    });

    io.on("connection", (socket) => {
        socket.emit("session", {
            sessionID: socket.data.sessionID,
            userID: socket.data.userID,
            username: socket.data.username,
        })
    })

    /**
     * On page load, call to pre-load friend list
     */
    io.on("connection", async (socket) => {
        try {
            let chatsData = await ChatController.findAllChatsOfAUser(`${socket.data.username}`);
            if (chatsData) {
                socket.emit("friend-list-rows-load", { chatsData })
            } else return null;
        } catch (err: any) {
            console.error(err);
            return undefined;
        }
    })

    io.on("connection", (socket) => {
        socket.on("send-private-message", async (content, to, chatID) => {
            try {
                let messageID = await ChatController.sendMessage(socket.data.username, content, chatID);
                if (messageID) {
                    socket.to(to).to(socket.data.username).emit("receive-private-message", {
                        content,
                        from: socket.data.username,
                        to,
                        chatID,
                        messageID
                    })
                    socket.emit("message-sent", {
                        content,
                        chatID,
                        messageID
                    })
                }
            } catch (err: any) {
                throw new Error(err);
            }
        })
    })

    io.on("connection", (socket) => {
        socket.join(socket.data.username);
    })

    io.on("connection", (socket) => {
        socket.on("disconnect", async () => {
            const matchingSockets = await io.in(socket.data.userID).fetchSockets();
            const isDisconnected = matchingSockets.length === 0;
            if (isDisconnected) {
                socket.broadcast.emit("user-disconnected", socket.data.userID);
            }
        })
    })

    // io.on("connection", (socket) => {
    //     socket.on("selected-user", async (receiverUsername) => {
    //         let senderUsername: string = socket.data.username;
    //         try {
    //             let chatID = await ChatController.checkIfChatExists(senderUsername, receiverUsername);
    //             if (!chatID) {
    //                 let initiated = await ChatController.initiateChat(senderUsername, receiverUsername);
    //                 console.log(initiated)
    //                 if (!initiated) {
    //                     return false;
    //                 };
    //                 socket.emit("initiate-chat", { initiated });
    //             } else {
    //                 let chatData = await ChatController.loadChat(chatID);
    //                 socket.emit("loaded-chat", { chatData });
    //             }
    //         } catch (err) {
    //             console.error(err);
    //             return undefined;
    //         }
    //     }
    //     )
    // })

    //SINGLE CHAT LOAD
    io.on("connection", (socket) => {
        socket.on("load-chat", async (chatID) => {
            try {
                let chatData = await ChatController.loadChat(chatID);
                if (chatData) {
                    socket.emit("loaded-chat", { chatData })
                } else return null;
            }
            catch (err: any) {
                console.error(err);
                return undefined;
            }
        })
    })

    io.on("connection", (socket) => {
        socket.on("seen", async (chatID, messageID) => {
            try {
                let seenDate = await ChatController.updateIfMessageIsSeen(chatID, messageID);
                // if(seenDate) {
                //     socket.emit("update-seen-status", { chatID, seenDate });
                // }
            } catch (err: any) {
                console.error(err);
                return undefined;
            }
        })
    })

    io.on("connection", (socket) => {
        socket.on("friend-request", async (user, target) => {
            try {
                let result = await FriendshipController.requestFriend(user, target);
                if (result) {
                    socket.emit("is-friend-request-successful", { result });
                }
            } catch (err: any) {
                console.error(err);
                return undefined;
            }
        })
    })

    io.on("connection", (socket) => {
        socket.on("search-input", async (user, searchInput) => {
            try {
                let usersResult = await LocalUsersController.getLocalUser(searchInput);
                let friendshipsResult = await FriendshipController.findFriendships(user);
                socket.emit("search-result", { usersResult, friendshipsResult });
            } catch (err: any) {
                console.error(err);
                return undefined;
            }
        });
    });

    // io.on("connection", (socket) => {
    //     socket.on("check-friendship-status", async (username, friendshipID) => {
    //         let status = await FriendshipController.findFriendship("", "", friendshipID);
    //         if (status) {
    //             socket.emit("friendship-status", { friendshipID, status, username });
    //         }
    //     })
    // })

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

// process
//     .on("SIGINT", RedisClient.redisGracefulExit)
//     .on("SIGTERM", RedisClient.redisGracefulExit);

export default app;

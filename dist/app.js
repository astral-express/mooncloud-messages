"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("ejs");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_ejs_layouts_1 = __importDefault(require("express-ejs-layouts"));
const express_session_1 = __importDefault(require("express-session"));
const body_parser_1 = __importDefault(require("body-parser"));
const http_errors_1 = __importDefault(require("http-errors"));
const debug_1 = __importDefault(require("debug"));
const logger_1 = require("./logger");
const http_1 = __importDefault(require("http"));
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("passport"));
const index_1 = __importDefault(require("./routes/index"));
require("./strategies/local.strategy");
require("./strategies/discord.strategy");
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const mongodb_database_1 = require("./database/mongodb.database");
const mongoose_1 = __importDefault(require("mongoose"));
const express_flash_1 = __importDefault(require("express-flash"));
const method_override_1 = __importDefault(require("method-override"));
require("redis");
const socket_io_1 = require("socket.io");
require("socket.io-client");
// import { RedisClient } from "./database/redis.database";
const admin_ui_1 = require("@socket.io/admin-ui");
const sessions_schema_1 = require("./database/schemas/sessions.schema");
const local_user_schema_1 = require("./database/schemas/local_user.schema");
const chat_controller_1 = require("./controllers/chat.controller");
const friendship_controller_1 = require("./controllers/friendship.controller");
const local_users_controller_1 = require("./controllers/local_users.controller");
const app = (0, express_1.default)();
// Initial db connection on app start
mongodb_database_1.Database._connect();
// Redis connection on app start
// RedisClient._connect();
// Ejs config
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "views"));
app.set("layout", "layouts/index");
app.use(express_ejs_layouts_1.default);
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, "/public")));
app.use("**/assets", express_1.default.static(path_1.default.join(__dirname, "/public/assets")));
app.use("**/utils", express_1.default.static(path_1.default.join(__dirname, "/public/utils")));
// Session config
let expressSessionMiddleware = (0, express_session_1.default)({
    secret: `${process.env.SECRET_KEY}`,
    saveUninitialized: false,
    resave: false,
    store: connect_mongo_1.default.create({
        mongoUrl: `${process.env.MONGO_URI}`,
    }),
});
app.use(expressSessionMiddleware);
// Passport config
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Display messages during authentication responses
app.use((0, express_flash_1.default)());
// Method override
app.use((0, method_override_1.default)("_method"));
// Morgan HTTP logger
app.use((0, morgan_1.default)("dev"));
// Index routing
app.use("/", index_1.default);
// Start the server if db connection is established
mongoose_1.default.connection.once("open", () => {
    // Server configs
    app.use(function (req, res, next) {
        next((0, http_errors_1.default)(404));
    });
    app.use(function (err, req, res, next) {
        res.locals.message = err.message;
        res.locals.error = req.app.get("env") === "development" ? err : {};
        res.status(err.status || 500);
        res.render("error");
    });
    const debug = (0, debug_1.default)("node_app:server");
    var port = normalizePort(process.env.PORT || "3000");
    app.set("port", port);
    var server = http_1.default.createServer(app);
    var domain = `${process.env.SERVER}`;
    var admin_url = `${process.env.SOCKET_IO_ADMIN_URL}`;
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: [domain, admin_url],
            credentials: true
        },
    });
    io.engine.use(expressSessionMiddleware);
    (0, admin_ui_1.instrument)(io, { auth: false });
    io.use((socket, next) => {
        expressSessionMiddleware(socket.request, {}, next);
    });
    io.use((socket, next) => __awaiter(void 0, void 0, void 0, function* () {
        const sessionID = socket.request.session.id;
        if (sessionID) {
            const result = yield sessions_schema_1.sessions.findOne({
                _id: sessionID,
            });
            if (result) {
                let session = result.session;
                let parsedSession = JSON.parse(session);
                let userID = parsedSession.passport.user;
                const user = yield local_user_schema_1.localUserModel.findOne({
                    _id: userID,
                });
                if (user) {
                    socket.data.sessionID = sessionID;
                    socket.data.userID = userID;
                    socket.data.username = user === null || user === void 0 ? void 0 : user.username;
                    return next();
                }
                else
                    throw new Error("No user found during SocketIO session search");
            }
        }
        else
            throw new Error("No sessionID found");
    }));
    io.on("connection", (socket) => {
        logger_1.logger.info(`A user(${socket.id}) has connected`);
        socket.on("disconnect", () => logger_1.logger.info(`User(${socket.id}) has disconnected`));
    });
    io.on("connection", (socket) => {
        socket.emit("session", {
            sessionID: socket.data.sessionID,
            userID: socket.data.userID,
            username: socket.data.username,
        });
    });
    /**
     * On page load, call to pre-load friend list
     */
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let chatsData = yield chat_controller_1.ChatController.findAllChatsOfAUser(`${socket.data.username}`);
            if (chatsData) {
                socket.emit("friend-list-rows-load", { chatsData });
            }
            else
                return null;
        }
        catch (err) {
            console.error(err);
            return undefined;
        }
    }));
    io.on("connection", (socket) => {
        socket.on("send-private-message", (content, to, chatID) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                let messageID = yield chat_controller_1.ChatController.sendMessage(socket.data.username, content, chatID);
                if (messageID) {
                    socket.to(to).to(socket.data.username).emit("receive-private-message", {
                        content,
                        from: socket.data.username,
                        to,
                        chatID,
                        messageID
                    });
                    socket.emit("message-sent", {
                        content,
                        chatID,
                        messageID
                    });
                }
            }
            catch (err) {
                throw new Error(err);
            }
        }));
    });
    io.on("connection", (socket) => {
        socket.join(socket.data.username);
    });
    io.on("connection", (socket) => {
        socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
            const matchingSockets = yield io.in(socket.data.userID).fetchSockets();
            const isDisconnected = matchingSockets.length === 0;
            if (isDisconnected) {
                socket.broadcast.emit("user-disconnected", socket.data.userID);
            }
        }));
    });
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
        socket.on("load-chat", (chatID) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                let chatData = yield chat_controller_1.ChatController.loadChat(chatID);
                if (chatData) {
                    socket.emit("loaded-chat", { chatData });
                }
                else
                    return null;
            }
            catch (err) {
                console.error(err);
                return undefined;
            }
        }));
    });
    io.on("connection", (socket) => {
        socket.on("seen", (chatID, messageID) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                let seenDate = yield chat_controller_1.ChatController.updateIfMessageIsSeen(chatID, messageID);
                // if(seenDate) {
                //     socket.emit("update-seen-status", { chatID, seenDate });
                // }
            }
            catch (err) {
                console.error(err);
                return undefined;
            }
        }));
    });
    io.on("connection", (socket) => {
        socket.on("friend-request", (user, target) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                let result = yield friendship_controller_1.FriendshipController.requestFriend(user, target);
                if (result) {
                    socket.emit("is-friend-request-successful", { result });
                }
            }
            catch (err) {
                console.error(err);
                return undefined;
            }
        }));
    });
    io.on("connection", (socket) => {
        socket.on("search-input", (user, searchInput) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                let usersResult = yield local_users_controller_1.LocalUsersController.getLocalUser(searchInput);
                let friendshipsResult = yield friendship_controller_1.FriendshipController.findFriendships(user);
                socket.emit("search-result", { usersResult, friendshipsResult });
            }
            catch (err) {
                console.error(err);
                return undefined;
            }
        }));
    });
    // io.on("connection", (socket) => {
    //     socket.on("check-friendship-status", async (username, friendshipID) => {
    //         let status = await FriendshipController.findFriendship("", "", friendshipID);
    //         if (status) {
    //             socket.emit("friendship-status", { friendshipID, status, username });
    //         }
    //     })
    // })
    server.listen(port, "0.0.0.0", () => logger_1.logger.info("Server running on port: " + port));
    server.on("error", onError);
    server.on("listening", onListening);
    function normalizePort(val) {
        var port = parseInt(val, 10);
        if (isNaN(port)) {
            return val;
        }
        if (port >= 0) {
            return port;
        }
        return false;
    }
    function onError(error) {
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
        var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
        debug("Listening on " + bind);
    }
});
// Close all connections if the app is exited
process
    .on("SIGINT", mongodb_database_1.Database.gracefulExit)
    .on("SIGTERM", mongodb_database_1.Database.gracefulExit);
// process
//     .on("SIGINT", RedisClient.redisGracefulExit)
//     .on("SIGTERM", RedisClient.redisGracefulExit);
exports.default = app;
//# sourceMappingURL=app.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainRouter = void 0;
const express_1 = require("express");
const login_router_1 = require("./login.router");
const signup_router_1 = require("./signup.router");
const logout_router_1 = require("./logout.router");
const router = (0, express_1.Router)();
/* GET home page */
router.get("/", (req, res) => {
    if (res.headersSent !== true) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
    }
    res.render("main", {
        description: "Home",
        user: req.user,
        warning_email: false,
        warning_username: false,
        warning_password: false,
        user_error_input: false,
        user_exists: false,
        acc_created: false,
    });
});
/* GET home/login modal */
router.get("/login", (req, res) => {
    if (res.headersSent !== true) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
    }
    res.render("main", {
        description: "Login",
        warning_email: req.flash("warning_email"),
        warning_password: req.flash("warning_password"),
        user_error_input: req.flash("error_input"),
        acc_created: req.flash("acc_created"),
        user_exists: false,
    });
});
/* GET home/signup modal */
router.get("/signup", (req, res) => {
    if (res.headersSent !== true) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
    }
    res.render("main", {
        description: "Sign up",
        user_exists: req.flash("user_exists"),
        warning_email: false,
        warning_username: false,
        warning_password: false,
        user_error_input: false,
        acc_created: false,
    });
});
router.post("/signup", signup_router_1.localSignupRouter);
router.post("/login", login_router_1.loginRouter);
router.delete("/logout", logout_router_1.logoutRouter);
exports.mainRouter = router;
//# sourceMappingURL=main.router.js.map
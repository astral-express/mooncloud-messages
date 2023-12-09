import { Router } from "express";
import { loginRouter } from "./login.router";
import { localSignupRouter } from "./signup.router";
import { logoutRouter } from "./logout.router";

const router = Router();

/* GET home page */
router.get("/", (req, res) => {
    (req as any).description = "Home";
    if (res.headersSent !== true) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
    }
    res.render("main", {
        description: (req as any).description,
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
    (req as any).description = "Login";
    if (res.headersSent !== true) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
    }
    res.render("main", {
        description: (req as any).description,
        warning_email: req.flash("warning_email"),
        warning_password: req.flash("warning_password"),
        user_error_input: req.flash("error_input"),
        acc_created: req.flash("acc_created"),
        user_exists: false,
    });
});

/* GET home/signup modal */
router.get("/signup", (req, res) => {
    (req as any).description = "Sign up";
    if (res.headersSent !== true) {
        res.setHeader("Content-Type", "text/html; charset=UTF-8");
    }
    res.render("main", {
        description: (req as any).description,
        user_exists: req.flash("user_exists"),
        warning_email: false,
        warning_username: false,
        warning_password: false,
        user_error_input: false,
        acc_created: false,
    });
});

router.post("/signup", localSignupRouter);

router.post("/login", loginRouter);

router.delete("/logout", logoutRouter);

export const mainRouter = router;

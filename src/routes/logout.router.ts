import { Router } from "express";
import { checkIsNotAuthenticated } from "../controllers/auth.controller";
var router = Router();

// Logout
router.delete("/logout", (req, res, next) => {
    req.session.authenticated = false;
    req.logOut((err) => {
        if (err) return next(err);
        res.redirect("/");
    });
});

// router.post("/logout?_method=DELETE", checkIsNotAuthenticated, (req, res) => {
//     if (res.headersSent !== true) {
//         res.setHeader("Content-Type", "text/html; charset=UTF-8");
//     }
// })

export const logoutRouter = router;

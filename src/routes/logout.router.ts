import { Router } from "express";
var router = Router();

// Logout
router.delete("/logout", (req, res, next) => {
    req.session.authenticated = false;
    req.logOut((err) => {
        if (err) return next(err);
        res.redirect("/");
    });
});

export const logoutRouter = router;

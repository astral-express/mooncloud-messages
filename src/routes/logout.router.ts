import { Router } from "express";
var router = Router();

// Logout
router.delete("/logout", (req, res, next) => {
  req.logOut((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

export const logoutRouter = router;

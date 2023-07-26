import { Router } from "express";
import passport from "passport";
var router = Router();

router.get("/redirect", passport.authenticate("discord"), (req, res) => {
  res.sendStatus(200);
  res.redirect("/");
});

export const discordRouter = router;

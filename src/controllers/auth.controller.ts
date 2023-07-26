import { Request, Response, NextFunction } from "express";

export function checkIsAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

export function checkIsNotAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}
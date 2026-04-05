import {
  getCurrentUserDetails,
  signInEmail,
  signOut,
  signUpEmail,
} from "@/domains/auth/auth.controller";
import { Router } from "express";

const authRouter: Router = Router();
authRouter.post("/sign-up", signUpEmail);
authRouter.post("/sign-in", signInEmail);
authRouter.post("/sign-out", signOut);
authRouter.get("/me", getCurrentUserDetails)

export default authRouter;

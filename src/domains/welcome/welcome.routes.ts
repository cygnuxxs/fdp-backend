import { Router } from "express";
import welcomeController from "@/domains/welcome/welcome.controller";

const welcomeRouter: Router = Router();
welcomeRouter.get("/", welcomeController);

export default welcomeRouter;

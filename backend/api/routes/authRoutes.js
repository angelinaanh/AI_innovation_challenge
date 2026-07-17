import { Router } from "express";

import { bootstrap, me } from "../controllers/authController.js";
import { authenticateRequest, requireProfile } from "../../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/bootstrap", authenticateRequest, bootstrap);
authRouter.get("/me", authenticateRequest, requireProfile, me);

import { Router } from "express";

import { escalations } from "../controllers/teacherController.js";

export const teacherRouter = Router();

teacherRouter.get("/escalations", escalations);

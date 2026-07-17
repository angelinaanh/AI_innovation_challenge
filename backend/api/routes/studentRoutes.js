import { Router } from "express";

import { dashboard, path } from "../controllers/studentController.js";

export const studentRouter = Router();

studentRouter.get("/dashboard", dashboard);
studentRouter.get("/path", path);

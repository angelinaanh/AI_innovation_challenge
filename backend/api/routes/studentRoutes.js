import { Router } from "express";

import {
  attempt,
  dashboard,
  lesson,
  path,
} from "../controllers/studentController.js";

export const studentRouter = Router();

studentRouter.get("/dashboard", dashboard);
studentRouter.get("/path", path);
studentRouter.get("/lessons/:skillNodeId", lesson);
studentRouter.post("/attempts", attempt);

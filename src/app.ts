import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { port } from "@/core/env";
import { Role } from "../generated/prisma/enums";
import { auth } from "@/core/auth-config";
import { authorize } from "@/core/middleware/authorize.middleware";
import { notFoundHandler } from "@/core/middleware/not-found.middleware";
import authRouter from "@/domains/auth/auth.routes";
import dashboardRouter from "@/domains/dashboard/dashboard.routes";
import recordsRouter from "@/domains/records/records.routes";
import userRouter from "@/domains/users/users.routes";
import welcomeRouter from "@/domains/welcome/welcome.routes";

const app: express.Application = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));
app.use(express.json());
app.use("/auth", authRouter);

app.use("/dashboard", authorize(Role.VIEWER), dashboardRouter);
app.use("/users", authorize(Role.ADMIN), userRouter);
app.use("/records", recordsRouter);

app.use("/", welcomeRouter);

app.use(notFoundHandler);

export default app;

if (!process.env["VERCEL"]) {
  app.listen(port, () => {
    console.log(
      `Finance Data Processing Backend is running on http://localhost:${port}`,
    );
  });
}
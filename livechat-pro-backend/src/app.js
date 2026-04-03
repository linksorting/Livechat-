import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import env from "./config/env.js";
import routes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { errorHandler } from "./middleware/error.js";

// routes/workspaces.js
import Workspace from './models/Workspace.js';


const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true
  })
);

app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

if (env.nodeEnv !== "test") {
  app.use(morgan("dev"));
}

app.use(
  "/api",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.use("/uploads", express.static(path.resolve(process.cwd(), env.fileUploadDir)));

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "LiveChat Pro backend is healthy",
    environment: env.nodeEnv
  });
});

app.use("/api/v1", routes);
// app.js mein ye line add karo (routes use karne ke baad)
app.use("/api/v1/chat", (await import('./routes/chat.js')).default);


// backend/routes/workspaces.js OR app.js mein


app.use(notFound);
app.use(errorHandler);





export default app;

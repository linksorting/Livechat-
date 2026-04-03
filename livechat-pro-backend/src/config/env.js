import dotenv from "dotenv";

dotenv.config();

const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/livechat-pro",
  jwtSecret: process.env.JWT_SECRET || "change-me-now",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  seedOnStart: String(process.env.SEED_ON_START || "false").toLowerCase() === "true",
  fileUploadDir: process.env.FILE_UPLOAD_DIR || "uploads",
  workspaceSlug: process.env.WORKSPACE_SLUG || "livechat-pro-demo"
};

export default env;

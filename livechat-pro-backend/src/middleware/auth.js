import User from "../models/User.js";
import ApiError from "../utils/apiError.js";
import { verifyToken } from "../utils/tokens.js";
import { ROLE_PERMISSIONS } from "../constants/roles.js";

export async function protect(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.replace("Bearer ", "") : null;

  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub).select("+password").populate("workspace");
    if (!user || !user.isActive) {
      return next(new ApiError(401, "User not found or inactive"));
    }
    req.user = user;
    req.workspaceId = user.workspace._id;
    next();
  } catch (error) {
    next(new ApiError(401, "Invalid or expired token"));
  }
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));
    if (!roles.length || roles.includes(req.user.role)) return next();
    return next(new ApiError(403, "Insufficient permissions"));
  };
}

export function requirePermission(permission) {
  return (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, "Authentication required"));
    const rolePermissions = ROLE_PERMISSIONS[req.user.role] || [];
    if (rolePermissions.includes("*") || rolePermissions.includes(permission)) {
      return next();
    }
    return next(new ApiError(403, "You do not have permission for this action"));
  };
}

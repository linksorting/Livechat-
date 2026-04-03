import ApiError from "../utils/apiError.js";

export function notFound(_req, _res, next) {
  next(new ApiError(404, "Route not found"));
}

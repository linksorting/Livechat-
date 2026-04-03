import { asyncHandler } from "../utils/asyncHandler.js";

export const uploadFiles = asyncHandler(async (req, res) => {
  const files = (req.files || []).map((file) => ({
    name: file.originalname,
    url: `/uploads/${file.filename}`,
    mimeType: file.mimetype,
    size: file.size
  }));

  res.status(201).json({
    success: true,
    data: files
  });
});

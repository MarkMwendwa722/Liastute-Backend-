const isDev = process.env.NODE_ENV !== "production";

const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res
      .status(400)
      .json({ success: false, message: "Validation error", errors: messages });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(", ");
    return res.status(409).json({
      success: false,
      message: `Duplicate value for: ${field}`,
    });
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid value for ${err.path}: ${err.value}`,
    });
  }

  // Multer upload errors (file too large, too many files, wrong field name)
  if (err.name === "MulterError") {
    const messages = {
      LIMIT_FILE_SIZE: "File too large. Each image must be 20 MB or less.",
      LIMIT_FILE_COUNT: "Too many files. Maximum of 10 images per product.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field — use the 'images' field for uploads.",
    };
    return res.status(400).json({ success: false, message: messages[err.code] || err.message });
  }

  // Truncated multipart body (upload aborted mid-stream, e.g. file exceeded limit)
  if (err instanceof Error && err.message === "Unexpected end of form") {
    return res.status(400).json({
      success: false,
      message: "Upload was interrupted. The image may exceed the 20 MB size limit.",
    });
  }

  const status = err.status || err.statusCode || 500;

  const exposeMessage = status < 500 || err.expose === true || isDev;
  const message = exposeMessage ? err.message : "Internal server error";

  return res.status(status).json({ success: false, message });
};

const notFound = (req, res) => {
  res
    .status(404)
    .json({ success: false, message: `Route ${req.originalUrl} not found` });
};

module.exports = { errorHandler, notFound };

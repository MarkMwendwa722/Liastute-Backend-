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

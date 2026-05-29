const isDev = process.env.NODE_ENV !== "production";

const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err);

  // Sequelize validation errors
  if (
    err.name === "SequelizeValidationError" ||
    err.name === "SequelizeUniqueConstraintError"
  ) {
    const messages = err.errors.map((e) => e.message);
    return res
      .status(400)
      .json({ success: false, message: "Validation error", errors: messages });
  }

  const status = err.status || err.statusCode || 500;

  // Expose the error message if:
  // - It's a client error (4xx), OR
  // - The error is explicitly marked as safe to expose (e.g. from external services), OR
  // - We're in development mode
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

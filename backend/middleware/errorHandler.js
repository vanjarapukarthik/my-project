export const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Not found - ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  // Common Mongoose errors should return client-friendly statuses instead of generic 500.
  if (err?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path || "value"}`,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  if (err?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: err.message || "Validation failed",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  if (err?.code === 11000) {
    const key = Object.keys(err.keyPattern || {})[0];
    return res.status(409).json({
      success: false,
      message: key ? `${key} already exists` : "Duplicate value",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  if (process.env.NODE_ENV !== "production") {
    console.error("Unhandled API error:", err);
  }

  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(status).json({
    success: false,
    message: err.message || "Server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

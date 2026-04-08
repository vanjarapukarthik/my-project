export const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Not found - ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, next) => {
  const status = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(status).json({
    success: false,
    message: err.message || "Server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

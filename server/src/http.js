export class AppError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function errorHandler(err, req, res, _next) {
  const invalidJson = err instanceof SyntaxError
    && (err.status === 400 || err.type === "entity.parse.failed" || Object.prototype.hasOwnProperty.call(err, "body"));
  if (invalidJson) {
    return res.status(400).json({ error: "Invalid JSON body." });
  }

  if (err?.name === "ZodError") {
    return res.status(400).json({
      error: "Validation failed",
      details: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: err.message,
      details: err.details,
    });
  }

  if (err?.code === "P2002") {
    return res.status(409).json({ error: "A record with that unique value already exists." });
  }
  if (err?.code === "P2025") {
    return res.status(404).json({ error: "Record not found." });
  }

  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}

export function notFound(_req, res) {
  res.status(404).json({ error: "Not found" });
}

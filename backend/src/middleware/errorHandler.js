function errorHandler(err, req, res, next) {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Photo must be under 5MB" });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  const status = err.status && Number.isInteger(err.status) ? err.status : 500;
  return res
    .status(status)
    .json({ error: err.message || "Internal server error" });
}

module.exports = errorHandler;

export function sendApiError(res, e, context) {
  console.error(context, e);

  if (e.name === "ValidationError") {
    const msg = Object.values(e.errors)
      .map((err) => err.message)
      .join("; ");
    return res.status(400).json({ error: msg || "Validation failed" });
  }

  if (e.code === 11000) {
    return res.status(409).json({ error: "Duplicate record" });
  }

  if (e.name === "CastError") {
    return res.status(400).json({ error: "Invalid id or reference" });
  }

  const msg =
    e.message?.includes("JWT_SECRET") || e.message?.includes("MONGODB")
      ? e.message
      : "Server error";
  return res.status(500).json({ error: msg });
}

function duplicateKeyMessage(e) {
  const fields = e.keyPattern ? Object.keys(e.keyPattern) : [];
  const values = e.keyValue || {};

  if (fields.includes("propertyContractAddress")) {
    return "Stale MongoDB index propertyContractAddress_1 is blocking saves. Restart the app after deploy, or in Atlas drop that index on the properties collection.";
  }
  if (fields.includes("dueDay") || (fields.includes("landlordId") && values.dueDay != null)) {
    return `You already have a property with due day ${values.dueDay}. Multiple properties can share the same due day — a stale database index was blocking this. Restart the app after deploy, or use Atlas → Indexes to drop a unique index on properties.dueDay.`;
  }
  if (fields.includes("phone")) {
    return `A tenant with phone ${values.phone || ""} already exists for your account.`;
  }
  if (fields.includes("email")) {
    return "This email is already registered.";
  }
  if (fields.length) {
    return `Duplicate value for: ${fields.join(", ")}`;
  }
  return "Duplicate record — check MongoDB indexes in Atlas.";
}

export function sendApiError(res, e, context) {
  console.error(context, e);

  if (e.name === "ValidationError") {
    const msg = Object.values(e.errors)
      .map((err) => err.message)
      .join("; ");
    return res.status(400).json({ error: msg || "Validation failed" });
  }

  if (e.code === 11000) {
    return res.status(409).json({ error: duplicateKeyMessage(e) });
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

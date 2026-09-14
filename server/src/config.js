const jwtSecret = process.env.JWT_SECRET || "";
if (!jwtSecret || jwtSecret === "CHANGE_ME") {
  throw new Error("JWT_SECRET is missing. Set a long random value in .env (see .env.example).");
}

function parseOrigins(value) {
  return String(value || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3001),
  listenHost: process.env.LISTEN_HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"),
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
};

import jsonwebtoken from "jsonwebtoken";
import { config } from "../config.js";
import { AppError } from "../http.js";

const jwt = jsonwebtoken.sign ? jsonwebtoken : jsonwebtoken.default;

export function signSession(user) {
  return jwt.sign(
    { sub: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn, algorithm: "HS256" },
  );
}

export function verifySession(token) {
  try {
    return jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
  } catch {
    throw new AppError(401, "Session expired or invalid. Please sign in again.");
  }
}

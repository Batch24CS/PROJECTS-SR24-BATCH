import jwt from "jsonwebtoken";

export function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, branch: user.branch },
    process.env.JWT_SECRET || "sweety_secret_key",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || "sweety_secret_key");
}

import jwt from "jsonwebtoken";
import Alumni from "../models/Alumni.js";

// Middleware to validate JWT token
export const validateToken = async (req, res, next) => {
  try {
    // Get token from headers
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    // Bearer <token>
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the alumni in DB
    const alumni = await Alumni.findById(decoded.id).select("-password");
    if (!alumni) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user to request
    req.user = alumni;
    next();
  } catch (error) {
    console.error("Token validation error:", error.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

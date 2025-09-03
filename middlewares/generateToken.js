import jwt from "jsonwebtoken";

export const generateToken = (alumni) => {
  return jwt.sign(
    { id: alumni._id, email: alumni.email }, 
    process.env.JWT_SECRET, 
    { expiresIn: "7d" } // token valid for 7 days
  );
};


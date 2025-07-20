const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = async (req, res, next) => {
  let token;

  // Check if authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract token from 'Bearer {token}'
      token = req.headers.authorization.split(" ")[1];
      console.log("Auth middleware: Processing token");

      // Verify token
      const secret = process.env.JWT_SECRET || "fallback_jwt_secret_key";
      console.log(
        "Using JWT secret:",
        secret ? "Secret is set" : "Secret is missing"
      );

      const decoded = jwt.verify(token, secret);
      console.log("Token verified, user ID:", decoded.id);

      // Find user by id and attach to request
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        console.log(`User with ID ${decoded.id} not found in database`);
        return res.status(401).json({ message: "User not found" });
      }

      console.log(
        `Auth middleware: Successfully authenticated user ${user.name}`
      );
      req.user = user;
      next();
    } catch (error) {
      console.error("Auth middleware error:", error.message);

      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Token expired, please login again" });
      } else if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "Invalid token" });
      }

      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    console.log("No authorization token found in request");
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

module.exports = { protect };

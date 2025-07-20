const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

// Generate JWT
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || "fallback_jwt_secret_key";
  console.log(
    "Using JWT secret:",
    secret ? "Secret is set" : "Secret is missing"
  );
  return jwt.sign({ id }, secret, {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please include all fields");
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email and include password for comparison
  const user = await User.findOne({ email }).select("+password");
  // Check if user exists and password matches
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Get current user
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    preferences: req.user.preferences,
  };
  res.status(200).json(user);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  console.log("Update profile request body:", req.body);
  console.log("User ID from token:", req.user._id);

  try {
    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      console.log("User not found with ID:", req.user._id);
      res.status(404);
      throw new Error("User not found");
    }

    // Check if password change is requested
    if (req.body.newPassword && req.body.currentPassword) {
      console.log("Password change requested");
      // Verify current password
      const isMatch = await user.matchPassword(req.body.currentPassword);
      if (!isMatch) {
        console.log("Current password verification failed");
        res.status(401);
        throw new Error("Current password is incorrect");
      }
      // Set new password
      user.password = req.body.newPassword;
      console.log("New password set");
    } // Update user fields if provided
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;

    // Update preferences if provided
    if (req.body.preferences) {
      user.preferences = {
        ...user.preferences,
        ...req.body.preferences,
      };
    }

    console.log("Saving updated user");
    const updatedUser = await user.save();
    console.log("User updated successfully:", updatedUser.name);

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      preferences: updatedUser.preferences,
    });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    if (!res.statusCode || res.statusCode === 200) {
      res.status(500);
    }
    throw error;
  }
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  updateProfile,
};

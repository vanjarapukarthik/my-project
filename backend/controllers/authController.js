import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";

const generateToken = (id) => jwt.sign({ id }, env.JWT_SECRET, { expiresIn: "7d" });

const ALLOWED_SIGNUP_ROLES = ["patient", "doctor"];

const normalizeEmail = (e) => (e && typeof e === "string" ? e.trim().toLowerCase() : "");

export const register = async (req, res, next) => {
  try {
    const { email: rawEmail, password, name, role } = req.body;
    const email = normalizeEmail(rawEmail);
    if (!email || !password || !name) {
      return res.status(400).json({ success: false, message: "Email, password and name are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }
    const signupRole = role && ALLOWED_SIGNUP_ROLES.includes(role) ? role : "patient";
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: "User already exists" });
    const user = await User.create({ email, password, name, role: signupRole });
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email: rawEmail, password } = req.body;
    const email = normalizeEmail(rawEmail);
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: "Invalid credentials" });
    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};

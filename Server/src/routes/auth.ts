import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserModel } from "../models/user";

const authRoute = Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Registro
authRoute.post("/register", async (req, res) => {
  const { nickname, password } = req.body;

  if (!nickname || !password) {
    return res.status(400).json({ message: "nickname e password são obrigatórios" });
  }

  const exists = await UserModel.findOne({ nickname });
  if (exists) {
    return res.status(400).json({ message: "nickname já está em uso" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new UserModel({
    nickname,
    password: hashedPassword,
  });

  await user.save();
  res.status(201).json({ message: "Usuário criado com sucesso" });
});

// Login
authRoute.post("/login", async (req, res) => {
  const { nickname, password } = req.body;

  if (!nickname || !password) {
    return res.status(400).json({ message: "nickname e password são obrigatórios" });
  }

  const user = await UserModel.findOne({ nickname });
  if (!user) {
    return res.status(400).json({ message: "Usuário não encontrado" });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(400).json({ message: "Senha inválida" });
  }

  const token = jwt.sign({ userId: user._id, nickname: user.nickname }, JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({
    token,
    user: { id: user._id, nickname: user.nickname, score: user.score },
  });
});

export { authRoute };

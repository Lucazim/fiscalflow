import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.get(
  "/perfil",
  authMiddleware,
  (req, res) => {
    return res.json({
      message: "Acesso autorizado",
      usuario: (req as any).usuario,
    });
  }
);

export default router;
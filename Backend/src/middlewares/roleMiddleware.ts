import { Request, Response, NextFunction } from "express";

export function roleMiddleware(
  rolesPermitidos: string[]
) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const usuario = (req as any).usuario;

    if (!usuario) {
      return res.status(401).json({
        message: "Usuário não autenticado",
      });
    }

    if (!rolesPermitidos.includes(usuario.tipo)) {
      return res.status(403).json({
        message: "Acesso negado",
      });
    }

    next();
  };
}
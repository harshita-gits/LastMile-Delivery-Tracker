import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { ApiError } from "../utils/ApiError";

// Usage: router.get("/admin-only", authenticate, requireRole("ADMIN"), handler)
export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Not authenticated"));
    }
    if (!allowed.includes(req.user.role)) {
      return next(
        new ApiError(403, `Forbidden: requires one of [${allowed.join(", ")}]`)
      );
    }
    next();
  };
}

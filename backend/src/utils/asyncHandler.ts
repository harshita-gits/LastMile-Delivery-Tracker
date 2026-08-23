import { Request, Response, NextFunction, RequestHandler } from "express";

// Wraps async controller functions so thrown errors / rejected promises
// are forwarded to Express's error-handling middleware instead of crashing
// the process or hanging the request.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

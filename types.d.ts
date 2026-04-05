declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: "VIEWER" | "ANALYST" | "ADMIN";
      };
    }
  }
}
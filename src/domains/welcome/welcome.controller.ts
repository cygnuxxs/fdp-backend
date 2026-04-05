import { type Request, type Response } from "express";

const developer = {
  name: "Ashok Atragadda",
  alias: "cygnuxxs",
  linkedIn: "https://linkedin.com/in/ashok-atragadda",
  github: "https://github.com/cygnuxxs",
} as const;

const welcomeController = (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "Finance Data Processing Backend",
    message: "API is running",
    developedBy: developer,
  });
};

export default welcomeController;

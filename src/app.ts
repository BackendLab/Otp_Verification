import express, { type Request, type Response } from "express";

export const app = express();
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Server is running 🚀");
});

//

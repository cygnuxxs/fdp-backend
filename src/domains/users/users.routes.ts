import { addUser, deleteUser, fetchUsers, updateUser } from "@/domains/users/users.controller";
import { Router } from "express";

const userRouter : Router = Router();

userRouter.get("/", fetchUsers);
userRouter.post("/", addUser);
userRouter.patch("/:id", updateUser);
userRouter.delete("/:id", deleteUser);

export default userRouter;
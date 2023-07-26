import yup, { object, string, number, date, InferType } from "yup";

export let userSchema = yup.object({
  email: string().email().required(),
  username: string().required(),
  password: string().min(6).max(32).required(),
});

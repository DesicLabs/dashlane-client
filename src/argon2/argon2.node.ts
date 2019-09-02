import * as argon2 from "argon2";
import { ArgonHashOptions } from "../types";

export const hash = async (
  plain: string,
  options: ArgonHashOptions
): Promise<Buffer> => {
  return await argon2.hash(plain, { ...options, raw: true });
};

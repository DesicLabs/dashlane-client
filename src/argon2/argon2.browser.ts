import * as argon2 from "argon2-browser";
import { ArgonHashOptions } from "../types";

export const hash = async (
  pass: string,
  options: ArgonHashOptions
): Promise<Buffer> => {
  const { hash } = await argon2.hash({
    pass,
    salt: options.salt,
    time: options.timeCost,
    mem: options.memoryCost,
    parallelism: options.parallelism,
    hashLen: options.hashLength,
    type: options.type
  });
  return Buffer.from(hash);
};

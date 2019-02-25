import crypto from "crypto";
import { SECRET } from "./consts";

export const addSaltPasswordOnce = function(pwd_MD5: string) {
    return crypto
        .createHash("md5")
        .update(pwd_MD5 + SECRET)
        .digest("hex");
};

export const addSaltPassword = function(pwd: string) {
    const firstMD5 = crypto
        .createHash("md5")
        .update(pwd)
        .digest("hex");
    return crypto
        .createHash("md5")
        .update(firstMD5 + SECRET)
        .digest("hex");
};

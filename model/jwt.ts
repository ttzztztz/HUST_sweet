import jwt from "jsonwebtoken";
import { IJWT } from "../typings/user";
import { SECRET } from "./consts";

export const signJWT = function(uid: string, username: string, isAdmin: boolean) {
    const signObj: IJWT = {
        uid: uid,
        username: username,
        isAdmin: isAdmin
    };
    return jwt.sign(signObj, SECRET, {
        expiresIn: 86400
    });
};

export const verifyJWT = function(token?: string) {
    if (!token) {
        throw new Error("No token provided");
    }
    if (token.indexOf("Bearer ") === 0) {
        token = token.replace("Bearer ", "");
    }
    return jwt.verify(token, SECRET) as IJWT;
};

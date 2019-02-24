import fs from "fs";
import { MODE } from "./consts";
import { verifyJWT } from "./jwt";

export const fileDestination = function(
    _req: Express.Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
) {
    const date = new Date();
    const dirName =
        date.getFullYear().toString() + "_" + (date.getMonth() + 1).toString() + "_" + date.getDate().toString();
    const parentDir = MODE === "DEV" ? `./upload/tmp` : `/var/bbs/upload/tmp`;
    const childDir = `${parentDir}/${dirName}`;
    if (!fs.existsSync(MODE === "DEV" ? `./upload` : "/var/bbs/upload")) fs.mkdirSync("/var/bbs/upload");
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir);
    if (!fs.existsSync(childDir)) fs.mkdirSync(childDir);
    cb(null, `${childDir}/`);
};

export const fileFilter = function(
    req: Express.Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void
) {
    try {
        verifyJWT((req as any)["header"]("Authorization"));
        cb(null, true);
    } catch {
        cb(null, false);
    }
};

export const fileName = function(
    req: Express.Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
) {
    try {
        const { uid } = verifyJWT((req as any)["header"]("Authorization"));
        cb(null, `${uid}_${file.originalname}_${new Date().getTime()}.rabbit`);
    } catch {
        cb(null, `ERR_${file.originalname}_${new Date().getTime()}.rabbit`);
    }
};

export const fileDelete = function(filename: string) {
    try {
        if (filename && fs.existsSync(filename)) {
            fs.unlinkSync(filename);
        }
    } catch (e) {
        console.log(e);
    }
};

import { Request, Response } from "express";
import multer from "multer";
import fs from "fs";
import { MODE } from "./consts";
import { verifyJWT } from "./jwt";
import { fileDelete, fileMove } from "./file";

export const fileDestination = function(
    _req: Express.Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
) {
    const dirName = "avatar";
    const parentDir = MODE === "DEV" ? `./upload` : `/var/sweet/upload`;
    const childDir = `${parentDir}/${dirName}`;
    if (!fs.existsSync(MODE === "DEV" ? `./upload` : "/var/sweet/upload")) fs.mkdirSync("/var/sweet/upload");
    if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir);
    if (!fs.existsSync(childDir)) fs.mkdirSync(childDir);
    cb(null, `${childDir}/`);
};

const fileName = function(
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

const fileFilter = function(
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

export const storage = multer.diskStorage({
    destination: fileDestination,
    filename: fileName
});

export const upload = multer({
    storage: storage,
    limits: { fileSize: 20971520 },
    fileFilter: fileFilter
});

export const uploadAvatar = async function(req: Request, res: Response) {
    const fileItem = req.file;
    try {
        const { uid } = verifyJWT(req.header("Authorization"));
        const oldPath = `${fileItem.destination}${fileItem.filename}`;
        if (!fs.existsSync(oldPath)) {
            res.json({ code: -1 });
            return;
        }

        const dirName = "avatar";
        const parentDir = MODE === "DEV" ? `./upload` : `/var/sweet/upload`;
        const childDir = `${parentDir}/${dirName}`;
        if (!fs.existsSync(MODE === "DEV" ? `./upload` : "/var/sweet/upload")) fs.mkdirSync("/var/sweet/upload");
        if (!fs.existsSync(parentDir)) fs.mkdirSync(parentDir);
        if (!fs.existsSync(childDir)) fs.mkdirSync(childDir);
        const newPath = `${childDir}/${uid}.rabbit`;
        if (fs.existsSync(newPath)) fs.unlinkSync(newPath);

        fileMove(oldPath, newPath);
        res.json({ code: 1 });
    } catch (e) {
        console.log(e);
        fileDelete(fileItem.destination + fileItem.filename);
        res.json({ code: -1, msg: e.message });
    }
};

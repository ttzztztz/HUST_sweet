import fs from "fs";
import { MODE } from "./consts";
import { verifyJWT } from "./jwt";
import { dbConnect } from "./db";
import { ObjectID } from "mongodb";
import { IFile, FILE_OK } from "../typings/types";

export const fileDestination = function(
    _req: Express.Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
) {
    const date = new Date();
    const dirName =
        date.getFullYear().toString() + "_" + (date.getMonth() + 1).toString() + "_" + date.getDate().toString();
    const parentDir = MODE === "DEV" ? `./upload/tmp` : `/var/sweet/upload/tmp`;
    const childDir = `${parentDir}/${dirName}`;
    if (!fs.existsSync(MODE === "DEV" ? `./upload` : "/var/sweet/upload")) fs.mkdirSync("/var/sweet/upload");
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

export const fileMove = function(fromPath: string, toPath: string) {
    return fs.renameSync(fromPath, toPath);
};

export const fileProcess = async function(fid: string, tid: string, uid: string, isAdmin: boolean) {
    const { db, client } = await dbConnect();

    try {
        const date = new Date();
        const dirName =
            date.getFullYear().toString() + "_" + (date.getMonth() + 1).toString() + "_" + date.getDate().toString();

        const attach = (await db.collection("file").findOne({
            _id: new ObjectID(fid)
        })) as IFile;
        const attachUid = attach.uid.toHexString();

        if (!isAdmin && attachUid !== uid) {
            return false;
        }

        const oldPath = attach.path;
        const newDir = MODE === "DEV" ? `./upload/${dirName}` : `/var/sweet/upload/${dirName}`;
        const newPath = `${newDir}/${new Date().getTime().toString()}_${fid}.rabbit`;

        if (!fs.existsSync(newDir)) fs.mkdirSync(newDir);
        fileMove(oldPath, newPath);

        await db.collection("file").updateOne(
            {
                _id: new ObjectID(fid)
            },
            {
                $set: {
                    path: newPath,
                    tid: new ObjectID(tid),
                    status: FILE_OK
                }
            }
        );
    } catch (e) {
        console.log(e);
    } finally {
        client.close();
    }
    return true;
};

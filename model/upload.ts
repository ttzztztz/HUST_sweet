import { Request, Response } from "express";
import { verifyJWT } from "./jwt";
import { fileDelete } from "./file";
import { IFile, FILE_PENDING } from "../typings/types";
import { ObjectID } from "mongodb";
import { dbConnect } from "./db";

export const upload = async function(req: Request, res: Response) {
    const fileItem = req.file;
    const { db, client } = await dbConnect();

    try {
        const { uid } = verifyJWT(req.header("Authorization"));

        const fileObj: IFile = {
            status: FILE_PENDING,
            uid: new ObjectID(uid),
            time: new Date()
        };

        const result = await db.collection("file").insertOne(fileObj);

        if (result.insertedCount) {
            res.json({ code: 1, msg: result.insertedId });
        } else {
            res.json({ code: -1 });
        }
    } catch (e) {
        res.json({ code: -1, msg: e.message });
        fileDelete(fileItem.destination + fileItem.filename);
        console.log(e);
    } finally {
        client.close();
    }
};

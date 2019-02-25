import { dbConnect } from "./db";
import { Request, Response } from "express";
import { ObjectID } from "mongodb";
import { PAGESIZE } from "./consts";
import { verifyJWT } from "./jwt";
import { ITask, IUserTask, FILE_OK, FILE_PENDING, IFile } from "../typings/types";
import { fileProcess } from "./file";

export const list = async function(req: Request, res: Response) {
    const { page } = req.params;
    const { db, client } = await dbConnect();
    try {
        const result = await db
            .collection("task")
            .aggregate([
                {
                    $sort: { createDate: -1 }
                },
                {
                    $skip: (+page - 1) * PAGESIZE
                },
                {
                    $limit: PAGESIZE
                }
            ])
            .toArray();
        const listCount = await db.collection("task").countDocuments({});

        res.json({ code: 1, msg: { list: result, count: listCount } });
    } catch (e) {
        console.log(e);
        res.json({ code: -1, msg: e.message });
    } finally {
        client.close();
    }
};

export const item = async function(req: Request, res: Response) {
    const { tid } = req.params;
    const { db, client } = await dbConnect();
    try {
        const { uid } = verifyJWT(req.header("Authorization"));

        const result = await db.collection("task").findOne({
            _id: new ObjectID(tid)
        });

        const done = (await db.collection("userTask").findOne({
            uid: uid,
            tid: tid
        })) as IUserTask;

        if (result) {
            if (done) {
                res.json({ code: 1, msg: { ...result, done: !!done, finishDate: done.time } });
            } else {
                res.json({ code: 1, msg: { ...result, done: !!done } });
            }
        } else {
            res.json({ code: -1, msg: "该任务不存在！" });
        }
    } catch (e) {
        console.log(e);
        res.json({ code: -1, msg: e.message });
    } finally {
        client.close();
    }
};

export const commit = async function(req: Request, res: Response) {
    // TODO: redlock
    const { tid, fid } = req.body;
    const { db, client } = await dbConnect();
    try {
        const { uid, isAdmin } = verifyJWT(req.header("Authorization"));

        const done = await db.collection("userTask").findOne({
            uid: uid,
            tid: tid
        });

        if (done) {
            res.json({ code: -1, msg: "您已完成该任务！" });
            return;
        }

        const fileObj = (await db.collection("file").findOne({
            _id: new ObjectID(fid),
            status: FILE_PENDING,
            uid: new ObjectID(uid)
        })) as IFile | undefined;

        if (!fileObj) {
            res.json({ code: -1, msg: "文件不存在！" });
            return;
        }

        const taskInfo = (await db.collection("task").findOne({
            _id: new ObjectID(tid)
        })) as ITask | undefined;

        if (!taskInfo) {
            res.json({ code: -1, msg: "任务不存在！" });
            return;
        }

        const resultFileProcess = await fileProcess(fid, tid, uid, isAdmin);

        if (!resultFileProcess) {
            res.json({ code: -1, msg: "文件处理失败！" });
            return;
        }

        const insertObj: IUserTask = {
            uid: new ObjectID(uid),
            tid: new ObjectID(tid),
            fid: new ObjectID(fid),
            time: new Date()
        };

        await db.collection("userTask").updateOne(
            {
                _id: fileObj!._id!
            },
            {
                $set: {
                    status: FILE_OK,
                    tid: new ObjectID(tid)
                }
            }
        );

        await db.collection("user").updateOne(
            {
                _id: new ObjectID(uid)
            },
            {
                $inc: { golds: taskInfo!.bonus }
            }
        );

        await db.collection("task").updateOne(
            {
                _id: new ObjectID(tid)
            },
            {
                $inc: { finishedCount: 1 }
            }
        );

        const result = await db.collection("userTask").insertOne(insertObj);

        if (result.insertedCount) {
            res.json({ code: 1, msg: result.insertedId });
        } else {
            res.json({ code: -1, msg: "未知错误！" });
        }
    } catch (e) {
        console.log(e);
        res.json({ code: -1, msg: e.message });
    } finally {
        client.close();
    }
};

export const create = async function(req: Request, res: Response) {
    const { db, client } = await dbConnect();
    try {
        const { isAdmin } = verifyJWT(req.header("Authorization"));
        if (!isAdmin) {
            res.json({ code: -1, msg: "无权操作！" });
            return;
        }
        const { content, readContent, bonus } = req.body;

        const insertObj: ITask = {
            content: content,
            readContent: readContent,
            bonus: +bonus,
            finishedCount: 0,
            createDate: new Date()
        };

        const result = await db.collection("task").insertOne(insertObj);

        if (result.insertedCount) {
            res.json({ code: 1, msg: result.insertedId });
        } else {
            res.json({ code: -1, msg: "未知错误！" });
        }
    } catch (e) {
        console.log(e);
        res.json({ code: -1, msg: e.message });
    } finally {
        client.close();
    }
};

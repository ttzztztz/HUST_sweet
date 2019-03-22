import { dbConnect } from "./db";
import { Request, Response } from "express";
import { ObjectID } from "mongodb";
import { PAGESIZE } from "./consts";
import { verifyJWT } from "./jwt";
import { ITask, IUserTask, FILE_OK, FILE_PENDING, IFile, STATUS_CHECKING, IRecord, STATUS_OK } from "../typings/types";
import { fileProcess } from "./file";
import { redLock } from "../server";

export const list = async function(req: Request, res: Response) {
    const { page } = req.params;
    const { db, client } = await dbConnect();
    try {
        const { uid } = verifyJWT(req.header("Authorization"));

        const resultRaw = await db
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

        const result = await Promise.all(
            resultRaw.map(async item => {
                const finished = await db.collection("userTask").findOne({
                    uid: new ObjectID(uid),
                    tid: new ObjectID(item.tid)
                });

                return {
                    ...item,
                    finished: !!finished
                };
            })
        );
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

        const userTask = (await db.collection("userTask").findOne({
            uid: new ObjectID(uid),
            tid: new ObjectID(tid)
        })) as IUserTask;

        const recordDone = (await db.collection("record").findOne({
            uid: new ObjectID(uid),
            tid: new ObjectID(tid)
        })) as IRecord;

        if (result) {
            if (userTask) {
                res.json({
                    code: 1,
                    msg: {
                        ...result,
                        done: !!userTask,
                        finishDate: userTask.time,
                        status: userTask.status,
                        recordDone: !!recordDone
                    }
                });
            } else {
                res.json({ code: 1, msg: { ...result, done: !!userTask, recordDone: !!recordDone } });
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
    const { tid, fid } = req.body;
    const { db, client } = await dbConnect();
    try {
        const { uid, isAdmin } = verifyJWT(req.header("Authorization"));

        const lockUser = await redLock.lock(`User:${uid}`, 200);

        try {
            const done = await db.collection("userTask").findOne({
                uid: new ObjectID(uid),
                tid: new ObjectID(tid)
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
                time: new Date(),
                status: STATUS_CHECKING
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

            const result = await db.collection("userTask").insertOne(insertObj);

            if (result.insertedCount) {
                res.json({ code: 1, msg: result.insertedId });
            } else {
                res.json({ code: -1, msg: "未知错误！" });
            }
        } catch (e) {
            console.log(e);
        } finally {
            lockUser.unlock();
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

export const check = async function(req: Request, res: Response) {
    const { id, status } = req.body;
    const { db, client } = await dbConnect();

    try {
        const { uid, isAdmin } = verifyJWT(req.header("Authorization"));
        if (!isAdmin) {
            res.json({ code: -1, msg: "无权操作！" });
            return;
        }

        if (+status < -1 || +status > 1) {
            res.json({ code: -1, msg: "参数不合法！" });
            return;
        }

        const lockCommit = await redLock.lock(`TaskCommit:${id}`, 200);
        try {
            const userTaskInfo = (await db.collection("userTask").findOne({
                _id: new ObjectID(id)
            })) as IUserTask | undefined;

            if (!userTaskInfo) {
                res.json({ code: -1, msg: "该条录音不存在！" });
                return;
            }

            if (userTaskInfo!.status === status || userTaskInfo!.status === STATUS_OK) {
                res.json({ code: -1, msg: "已经被审核！" });
                return;
            }

            const taskInfo = (await db.collection("task").findOne({
                _id: new ObjectID(userTaskInfo!.tid)
            })) as ITask | undefined;

            if (!taskInfo) {
                res.json({ code: -1, msg: "任务不存在！" });
                return;
            }

            const result = await db.collection("userTask").updateOne(
                {
                    _id: new ObjectID(id)
                },
                {
                    $set: {
                        status: +status
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

            if (result.modifiedCount) {
                res.json({ code: 1 });
            } else {
                res.json({ code: -1 });
            }
        } catch (e) {
            res.json({ code: -1 });
            console.log(e.message);
        } finally {
            await lockCommit.unlock();
        }
    } catch (e) {
        console.log(e);
        res.json({ code: -1, msg: e.message });
    } finally {
        client.close();
    }
};

export const recordList = async function(req: Request, res: Response) {
    const { tid, page } = req.params;
    const { db, client } = await dbConnect();
    try {
        verifyJWT(req.header("Authorization"));

        const result = await db
            .collection("record")
            .aggregate([
                {
                    $match: {
                        tid: new ObjectID(tid)
                    }
                },
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

        const listCount = await db.collection("record").countDocuments({ tid: new ObjectID(tid) });

        res.json({ code: 1, msg: { list: result, count: listCount } });
    } catch (e) {
        console.log(e);
        res.json({ code: -1, msg: e.message });
    } finally {
        client.close();
    }
};

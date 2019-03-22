import { IPointItem, IFile, IUserTask, IRecord, STATUS_CHECKING, ITask, STATUS_OK } from "../typings/types";
import { Request, Response } from "express";
import { dbConnect } from "./db";
import { ObjectID } from "mongodb";
import { PAGESIZE } from "./consts";
import { verifyJWT } from "./jwt";
import { redLock } from "../server";

export const download = async function(req: Request, res: Response) {
    const { id } = req.params;
    const { db, client } = await dbConnect();
    try {
        // verifyJWT(req.header("Authorization"));

        const fileInfo = (await db.collection("file").findOne({
            _id: new ObjectID(id)
        })) as IFile;

        res.download(fileInfo.path);
    } catch (e) {
        console.log(e);
        res.json({ code: -1, msg: e.message });
    } finally {
        client.close();
    }
};

export const list = async function(req: Request, res: Response) {
    const { page } = req.params;
    const { db, client } = await dbConnect();
    try {
        const { uid } = verifyJWT(req.header("Authorization"));

        const resultRaw = await db
            .collection("record")
            .aggregate([
                {
                    $project: {
                        _id: 1,
                        uid: 1,
                        tid: 1,
                        status: 1,
                        time: 1
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
        const listCount = await db.collection("record").countDocuments({});

        res.json({ code: 1, msg: { list: result, count: listCount } });
    } catch (e) {
        console.log(e);
        res.json({ code: -1, msg: e.message });
    } finally {
        client.close();
    }
};

export const commit = async function(req: Request, res: Response) {
    const { tid, points } = req.body;
    const { db, client } = await dbConnect();
    try {
        const { uid } = verifyJWT(req.header("Authorization"));

        const lockUser = await redLock.lock(`User:${uid}`, 2000);

        try {
            const done = await db.collection("record").findOne({
                uid: new ObjectID(uid),
                tid: new ObjectID(tid)
            });

            if (done) {
                res.json({ code: -1, msg: "您已提交过这段标记，无法再次提交！" });
                return;
            }

            const taskInfo = (await db.collection("task").findOne({
                _id: new ObjectID(tid)
            })) as ITask | undefined;

            if (!taskInfo) {
                res.json({ code: -1, msg: "任务不存在！" });
                return;
            }

            const insertObj: IRecord = {
                uid: new ObjectID(uid),
                tid: new ObjectID(tid),
                time: new Date(),
                status: STATUS_CHECKING,
                points: points as Array<IPointItem>
            };

            await db.collection("user").updateOne(
                {
                    _id: new ObjectID(uid)
                },
                {
                    $inc: { golds: taskInfo!.bonus }
                }
            );

            const result = await db.collection("record").insertOne(insertObj);

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

export const check = async function(req: Request, res: Response) {
    const { rid, status } = req.body;
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

        const lockCommit = await redLock.lock(`RecordCommit:${rid}`, 200);
        try {
            const recordInfo = (await db.collection("record").findOne({
                _id: new ObjectID(rid)
            })) as IRecord | undefined;

            if (!recordInfo) {
                res.json({ code: -1, msg: "该条标注不存在！" });
                return;
            }

            if (recordInfo!.status === status || recordInfo!.status === STATUS_OK) {
                res.json({ code: -1, msg: "已经被审核！" });
                return;
            }

            const taskInfo = (await db.collection("task").findOne({
                _id: new ObjectID(recordInfo!.tid)
            })) as ITask | undefined;

            if (!taskInfo) {
                res.json({ code: -1, msg: "任务不存在！" });
                return;
            }

            const result = await db.collection("record").updateOne(
                {
                    _id: new ObjectID(rid)
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

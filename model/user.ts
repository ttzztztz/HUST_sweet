import { dbConnect } from "./db";
import { Request, Response } from "express";
import { addSaltPasswordOnce } from "./md5";
import { IUser, STATUS_CHECKING, STATUS_OK, STATUS_FAILURE } from "../typings/types";
import { signJWT, verifyJWT } from "./jwt";
import { ObjectID } from "mongodb";
import { PAGESIZE } from "./consts";
import { MODE } from "./consts";
import fs from "fs";

export const reg = async function(req: Request, res: Response) {
    const { db, client } = await dbConnect();

    try {
        const { email, username, password, mobile } = req.body;

        const existCheck = await db
            .collection("user")
            .find({
                $or: [{ username: username }, { email: email }, { mobile: mobile }]
            })
            .toArray();

        if (existCheck.length !== 0) {
            res.json({ code: -1, msg: "用户名或电子邮箱或手机号码已存在！" });
            return;
        }

        const pwd_md5 = addSaltPasswordOnce(password);

        const userObj: IUser = {
            username: username,
            password: pwd_md5,
            mobile: mobile,
            email: email,
            isAdmin: false,
            golds: 0,
            lastLogin: new Date(),
            createDate: new Date(),
            region: "武汉",
            isDialect: false
        };

        const result = await db.collection("user").insertOne(userObj);

        if (result.insertedCount) {
            res.json({ code: 1, msg: signJWT(result.insertedId.toHexString(), username, false) });
        } else {
            res.json({ code: -1, msg: "未知错误！" });
        }
    } catch (e) {
        res.json({ code: -1, msg: e.message });
        console.log(e);
    } finally {
        client.close();
    }
};

export const login = async function(req: Request, res: Response) {
    const { db, client } = await dbConnect();

    try {
        const { username, password } = req.body;

        const pwd_md5 = addSaltPasswordOnce(password);

        const [userResult] = await db
            .collection("user")
            .find({
                $or: [
                    {
                        username: username
                    },
                    {
                        mobile: username
                    },
                    {
                        email: username
                    }
                ]
            })
            .toArray();

        if (!userResult) {
            res.json({ code: -1, msg: "用户不存在！" });
            return;
        }

        const user = userResult as IUser;

        if (user.password === pwd_md5) {
            db.collection("user").updateOne(
                {
                    _id: new ObjectID(user._id!)
                },
                {
                    $set: {
                        lastLogin: new Date()
                    }
                }
            );

            res.json({
                code: 1,
                msg: {
                    token: signJWT(user._id!.toHexString(), user.username, user.isAdmin),
                    username: user.username,
                    isAdmin: user.isAdmin,
                    golds: user.golds,
                    email: user.email,
                    uid: user._id!.toHexString()
                }
            });
        } else {
            res.json({ code: -1, msg: "密码错误！" });
        }
    } catch (e) {
        res.json({ code: -1, msg: e.message });
        console.log(e);
    } finally {
        client.close();
    }
};

export const info = async function(req: Request, res: Response) {
    const { db, client } = await dbConnect();

    try {
        const { username } = verifyJWT(req.header("Authorization"));

        const user = (await db.collection("user").findOne({
            username: username
        })) as IUser;

        res.json({
            code: 1,
            msg: {
                username: user.username,
                isAdmin: user.isAdmin,
                golds: user.golds,
                email: user.email
            }
        });
    } catch (e) {
        res.json({ code: -1, msg: e.message });
        console.log(e);
    } finally {
        client.close();
    }
};

export const update = async function(req: Request, res: Response) {
    const { db, client } = await dbConnect();

    try {
        const { username } = verifyJWT(req.header("Authorization"));

        const { mobile, region, isDialect } = req.body;
        await db.collection("user").updateOne(
            {
                username: username
            },
            {
                $set: {
                    mobile,
                    region,
                    isDialect: !!isDialect
                }
            }
        );

        res.json({
            code: 1
        });
    } catch (e) {
        res.json({ code: -1, msg: e.message });
        console.log(e);
    } finally {
        client.close();
    }
};

export const pwd = async function(req: Request, res: Response) {
    const { db, client } = await dbConnect();

    try {
        const { username } = verifyJWT(req.header("Authorization"));
        const { oldPwd, newPwd } = req.body;

        const oldPwdMd5 = addSaltPasswordOnce(oldPwd);
        const newPwdMd5 = addSaltPasswordOnce(newPwd);

        const user = (await db.collection("user").findOne({
            username: username
        })) as IUser;

        if (user.password === oldPwdMd5) {
            db.collection("user").updateOne(
                {
                    _id: new ObjectID(user._id!)
                },
                {
                    $set: {
                        password: newPwdMd5
                    }
                }
            );

            res.json({
                code: 1
            });
        } else {
            res.json({ code: -1, msg: "密码错误！" });
        }
    } catch (e) {
        res.json({ code: -1, msg: e.message });
        console.log(e);
    } finally {
        client.close();
    }
};

export const tasks = async function(req: Request, res: Response) {
    const { db, client } = await dbConnect();

    try {
        const { uid } = verifyJWT(req.header("Authorization"));
        const { page } = req.params;
        const { type } = req.body; //Extended 2:ALL

        const matchObj = +type === 2 ? { uid: new ObjectID(uid) } : { uid: new ObjectID(uid), status: +type };

        const myTaskListRaw = await db
            .collection("userTask")
            .aggregate([
                {
                    $match: matchObj
                },
                {
                    $sort: {
                        time: -1
                    }
                },
                {
                    $skip: (+page - 1) * PAGESIZE
                },
                {
                    $limit: PAGESIZE
                }
            ])
            .toArray();

        const myTaskList = await Promise.all(
            myTaskListRaw.map(async item => ({
                ...item,
                taskInfo: await db.collection("task").findOne({
                    _id: new ObjectID(item.tid)
                })
            }))
        );

        const myTaskListCount = await db.collection("userTask").countDocuments({
            uid: new ObjectID(uid)
        });

        res.json({
            code: 1,
            msg: { list: myTaskList, count: myTaskListCount }
        });
    } catch (e) {
        res.json({ code: -1, msg: e.message });
        console.log(e);
    } finally {
        client.close();
    }
};

export const records = async function(req: Request, res: Response) {
    const { db, client } = await dbConnect();

    try {
        const { uid } = verifyJWT(req.header("Authorization"));
        const { page } = req.params;
        const { type } = req.body; //Extended 2:ALL

        const matchObj = +type === 2 ? { uid: new ObjectID(uid) } : { uid: new ObjectID(uid), status: +type };

        const myRecordListRaw = await db
            .collection("record")
            .aggregate([
                {
                    $match: matchObj
                },
                {
                    $sort: {
                        time: -1
                    }
                },
                {
                    $skip: (+page - 1) * PAGESIZE
                },
                {
                    $limit: PAGESIZE
                }
            ])
            .toArray();

        const myRecordList = await Promise.all(
            myRecordListRaw.map(async item => ({
                ...item,
                taskInfo: await db.collection("task").findOne({
                    _id: new ObjectID(item.tid)
                })
            }))
        );

        const myRecordListCount = await db.collection("record").countDocuments({
            uid: new ObjectID(uid)
        });

        res.json({
            code: 1,
            msg: { list: myRecordList, count: myRecordListCount }
        });
    } catch (e) {
        res.json({ code: -1, msg: e.message });
        console.log(e);
    } finally {
        client.close();
    }
};

export const dashboard = async function(req: Request, res: Response) {
    const { db, client } = await dbConnect();

    try {
        const { uid } = verifyJWT(req.header("Authorization"));

        const userInfo = (await db.collection("user").findOne({
            _id: new ObjectID(uid)
        })) as IUser;

        const task = {
            waiting: await db.collection("userTask").countDocuments({
                uid: new ObjectID(uid),
                status: STATUS_CHECKING
            }),
            ok: await db.collection("userTask").countDocuments({
                uid: new ObjectID(uid),
                status: STATUS_OK
            }),
            failed: await db.collection("userTask").countDocuments({
                uid: new ObjectID(uid),
                status: STATUS_FAILURE
            })
        };

        const record = {
            waiting: await db.collection("record").countDocuments({
                uid: new ObjectID(uid),
                status: STATUS_CHECKING
            }),
            ok: await db.collection("record").countDocuments({
                uid: new ObjectID(uid),
                status: STATUS_OK
            }),
            failed: await db.collection("record").countDocuments({
                uid: new ObjectID(uid),
                status: STATUS_FAILURE
            })
        };

        res.json({
            code: 1,
            msg: {
                task: {
                    ...task,
                    total: task.waiting + task.ok + task.failed
                },
                record: {
                    ...record,
                    total: record.waiting + record.ok + record.failed
                },
                golds: userInfo.golds,
                region: userInfo.region,
                mobile: userInfo.mobile,
                isDialect: userInfo.isDialect,
                username: userInfo.username,
                uid: userInfo._id!
            }
        });
    } catch (e) {
        res.json({ code: -1, msg: e.message });
        console.log(e);
    } finally {
        client.close();
    }
};

export const avatar = async function(req: Request, res: Response) {
    try {
        // verifyJWT(req.header("Authorization"));
        const { uid } = req.params;

        const dirName = "avatar";
        const parentDir = MODE === "DEV" ? `./upload` : `/var/sweet/upload`;
        const childDir = `${parentDir}/${dirName}`;
        const newPath = `${childDir}/${uid}.rabbit`;

        if (fs.existsSync(newPath)) {
            res.download(newPath);
        } else {
            res.download(`${childDir}/default.rabbit`);
        }
    } catch (e) {
        res.json({ code: -1, msg: e.message });
        console.log(e);
    }
};

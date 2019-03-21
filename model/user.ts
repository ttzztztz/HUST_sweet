import { dbConnect } from "./db";
import { Request, Response } from "express";
import { addSaltPasswordOnce } from "./md5";
import { IUser } from "../typings/types";
import { signJWT, verifyJWT } from "./jwt";
import { ObjectID } from "mongodb";
import { PAGESIZE } from "./consts";

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
                    email: user.email
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

        res.json({
            code: 1,
            msg: myTaskList
        });
    } catch (e) {
        res.json({ code: -1, msg: e.message });
        console.log(e);
    } finally {
        client.close();
    }
};

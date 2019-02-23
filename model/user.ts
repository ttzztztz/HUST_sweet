import { dbConnect } from "./db";
import { Request, Response } from "express";
import { addSaltPasswordOnce } from "./md5";
import { IUser } from "../typings/user";
import { signJWT, verifyJWT } from "./jwt";
import { ObjectID } from "bson";

export const reg = async function(req: Request, res: Response) {
    const { db, client } = await dbConnect();

    try {
        const { email, username, password } = req.body;

        const existCheck = await db
            .collection("user")
            .find({
                $or: [{ username: username }, { email: email }]
            })
            .toArray();

        if (existCheck.length !== 0) {
            res.json({ code: -1, msg: "用户名或电子邮箱已存在！" });
            return;
        }

        const pwd_md5 = addSaltPasswordOnce(password);

        const userObj: IUser = {
            username: username,
            password: pwd_md5,
            email: email,
            isAdmin: false,
            golds: 0,
            lastLogin: new Date()
        };

        const result = await db.collection("user").insertOne(userObj);

        if (result.insertedCount === 1) {
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

        const userResult = await db.collection("user").findOne({
            username: username
        });

        if (!userResult) {
            res.json({ code: -1, msg: "用户名不存在！" });
            return;
        }

        const user = userResult as IUser;

        if (user.password === pwd_md5) {
            db.collection("user").update(
                {
                    _id: new ObjectID(user._id!)
                },
                {
                    lastLogin: new Date()
                }
            );

            res.json({
                code: 1,
                msg: {
                    token: signJWT(user._id!.toHexString(), user.username, user.isAdmin),
                    username: user.username,
                    isAdmin: user.isAdmin,
                    golds: user.golds
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
                golds: user.golds
            }
        });
    } catch (e) {
        res.json({ code: -1, msg: e.message });
        console.log(e);
    } finally {
        client.close();
    }
};

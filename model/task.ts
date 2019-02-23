import { dbConnect } from "./db";
import { Request, Response } from "express";
import { ObjectID } from "bson";

export const list = async function(req: Request, res: Response) {
    const { page } = req.params;
    const { db, client } = await dbConnect();
    try {
        const result = await db
            .collection("task")
            .aggregate([])
            .toArray();
        res.json({ code: 1, msg: result });
    } catch (e) {
        console.log(e);
        res.json({ code: -1, msg: e.message });
    } finally {
        client.close();
    }
};

export const item = async function(req: Request, res: Response) {
    const { id } = req.params;
    const { db, client } = await dbConnect();
    try {
        const result = await db.collection("task").findOne({
            _id: new ObjectID(id)
        });

        if (result) {
            res.json({ code: 1, msg: result });
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
    const { id } = req.params;
    const { db, client } = await dbConnect();
    try {
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
    } catch (e) {
        console.log(e);
        res.json({ code: -1, msg: e.message });
    } finally {
        client.close();
    }
};

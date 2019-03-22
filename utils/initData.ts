require("dotenv").config();

import { dbConnect } from "../model/db";
import { IUser } from "../typings/types";
import { addSaltPassword } from "../model/md5";

(async () => {
    const { db, client } = await dbConnect();
    try {
        const insertObj: IUser = {
            username: "admin",
            password: addSaltPassword("admin"),
            email: "admin@admin.com",
            isAdmin: true,
            golds: 0,
            createDate: new Date(),
            lastLogin: new Date(),
            mobile: "13838383838",
            region: "武汉",
            isDialect: false
        };
        await db.collection("user").insertOne(insertObj);
    } catch (e) {
        console.log(e);
    } finally {
        client.close();
    }
})();

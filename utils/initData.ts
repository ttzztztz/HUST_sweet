import { dbConnect } from "../model/db";
import { IUser } from "../typings/types";

(async () => {
    const { db, client } = await dbConnect();
    try {
        const insertObj: IUser = {
            username: "admin",
            password: "",
            email: "admin@admin.com",
            isAdmin: true,
            golds: 0,
            createDate: new Date(),
            lastLogin: new Date()
        };
        await db.collection("user").insertOne(insertObj);
    } catch (e) {
        console.log(e);
    } finally {
        client.close();
    }
})();

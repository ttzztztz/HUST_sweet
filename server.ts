require("dotenv").config();

import express from "express";
import bodyParser from "body-parser";
import * as User from "./model/user";
import * as Task from "./model/task";
// import multer from "multer";

const app = express();
const SERVER_VERSION = "1.00";

app.use(
    bodyParser.urlencoded({
        extended: true
    })
);

app.use(
    bodyParser.json({
        limit: "1mb"
    })
);

app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, GET");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("X-Powered-By", `Rabbit/${SERVER_VERSION}`);
    next();
});

//User
app.get("/user/info/:uid", User.info);
app.post("/user/login", User.login);
app.post("/user/reg", User.reg);

//Task
app.get("/task/list/:page", Task.list);
app.get("/task/item/:id", Task.item);
app.post("/task/commit/:id", Task.commit);
app.post("/task/create", Task.create);

app.listen(8888, () => {
    console.log(`Rabbit WebServer / ${SERVER_VERSION} is running on port 8888.`);
});

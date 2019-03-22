require("dotenv").config();

import express from "express";
import bodyParser from "body-parser";
import multer from "multer";
import Redis from "redis";
import Redlock from "redlock";
import fs from "fs";

import * as User from "./model/user";
import * as Task from "./model/task";
import * as Upload from "./model/upload";
import * as Record from "./model/record";
import * as Avatar from "./model/avatar";

import { fileDestination, fileFilter, fileName } from "./model/file";
import { MODE } from "./model/consts";

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

const storage = multer.diskStorage({
    destination: fileDestination,
    filename: fileName
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 20971520 },
    fileFilter: fileFilter
});

export const redisClient = Redis.createClient({
    host: MODE === "DEV" ? "localhost" : "redis",
    port: 6379
});

export const redLock = new Redlock([redisClient], {
    driftFactor: 0.01,
    retryCount: 10,
    retryDelay: 200,
    retryJitter: 200
});

//User
app.get("/user/info/:username", User.info);
app.get("/user/dashboard", User.dashboard);
app.get("/user/tasks/:page", User.tasks);
app.get("/user/records/:page", User.records);
app.get("/user/avatar/:uid", User.avatar);
app.post("/user/login", User.login);
app.post("/user/reg", User.reg);
app.post("/user/pwd", User.pwd);
app.post("/user/update", User.update);

//Task
app.get("/task/list/:page", Task.list);
app.get("/task/item/:tid", Task.item);
app.get("/task/record/:tid/:page", Task.recordList);
app.post("/task/commit", Task.commit);
app.post("/task/check", Task.check);
app.post("/task/create", Task.create);

//Record
app.get("/record/download/:id", Record.download);
app.get("/record/list/:page", Record.list);
app.post("/record/commit", Record.commit);
app.post("/record/check", Record.check);

//Upload
app.post("/upload", upload.single("attach"), Upload.upload);
app.post("/avatar", Avatar.upload.single("avatar"), Avatar.uploadAvatar);

app.listen(8888, () => {
    console.log(`Rabbit WebServer / ${SERVER_VERSION} is running on port 8888.`);
});

if (MODE !== "DEV" && !fs.existsSync("/var/sweet/install.lock")) {
    fs.writeFileSync("/var/sweet/install.lock", "1");
    require("./utils/initData.js");
    console.log("Init data OK!");
}

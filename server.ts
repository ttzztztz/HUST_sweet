require("dotenv").config();

import express from "express";
import bodyParser from "body-parser";
import multer from "multer";

import * as User from "./model/user";
import * as Task from "./model/task";
import * as Upload from "./model/upload";
import { fileDestination, fileFilter, fileName } from "./model/file";

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
}); //20MB

//User
app.get("/user/info/:uid", User.info);
app.post("/user/login", User.login);
app.post("/user/reg", User.reg);

//Task
app.get("/task/list/:page", Task.list);
app.get("/task/item/:tid", Task.item);
app.post("/task/commit/:tid/:fid", Task.commit);
app.post("/task/create", Task.create);

//Upload
app.post("/upload", upload.single("attach"), Upload.upload);

app.listen(8888, () => {
    console.log(`Rabbit WebServer / ${SERVER_VERSION} is running on port 8888.`);
});

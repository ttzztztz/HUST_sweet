import { ObjectID } from "mongodb";

export interface IUser {
    _id?: ObjectID;
    username: string;
    password: string;
    email: string;
    isAdmin: boolean;
    golds: number;
    lastLogin: Date;
}

export interface ITask {
    _id?: ObjectID;
    content: string;
    read: string;
    bonus: number;
    finishedCount: number;
}

export interface IUserTask {
    _id?: ObjectID;
    uid: ObjectID;
    tid: ObjectID;
    time: Date;
    filePath: string;
}

export interface IJWT {
    uid: string;
    username: string;
    isAdmin: boolean;
}

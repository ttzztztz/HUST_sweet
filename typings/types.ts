import { ObjectID } from "mongodb";

export const FILE_PENDING = 0;
export type FILE_PENDING = typeof FILE_PENDING;

export const FILE_OK = 1;
export type FILE_OK = typeof FILE_OK;
export type FileStatus = FILE_PENDING | FILE_OK;

export interface IUser {
    _id?: ObjectID;
    username: string;
    password: string;
    email: string;
    isAdmin: boolean;
    golds: number;
    createDate: Date;
    lastLogin: Date;
}

export interface ITask {
    _id?: ObjectID;
    content: string;
    readContent: string;
    bonus: number;
    finishedCount: number;
    createDate: Date;
}

export interface IUserTask {
    _id?: ObjectID;
    uid: ObjectID;
    tid: ObjectID;
    fid: ObjectID;
    time: Date;
}

export interface IFile {
    _id?: ObjectID;
    tid?: ObjectID;
    status: FileStatus;
    uid: ObjectID;
    time: Date;
    path: string;
}

export interface IJWT {
    uid: string;
    username: string;
    isAdmin: boolean;
}

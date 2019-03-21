import { ObjectID } from "mongodb";

export const FILE_PENDING = 0;
export type FILE_PENDING = typeof FILE_PENDING;

export const FILE_OK = 1;
export type FILE_OK = typeof FILE_OK;
export type FileStatus = FILE_PENDING | FILE_OK;

export const STATUS_CHECKING = 0;
export type STATUS_CHECKING = typeof STATUS_CHECKING;
export const STATUS_FAILURE = -1;
export type STATUS_FAILURE = typeof STATUS_FAILURE;
export const STATUS_OK = 1;
export type STATUS_OK = typeof STATUS_OK;

export interface IUser {
    _id?: ObjectID;
    username: string;
    password: string;
    email: string;
    isAdmin: boolean;
    golds: number;
    createDate: Date;
    lastLogin: Date;
    mobile: string;
    region: string;
    isDialect: boolean;
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
    points: Array<IPointItem>;
    status: STATUS_CHECKING | STATUS_FAILURE | STATUS_OK;
    time: Date;
}

export interface IPointItem {
    begin: number;
    end: number;
    text: string;
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

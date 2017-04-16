"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
// type TextBuffer = any;
// type Point = any;
// type Range = any;
// var { Range } = require('atom');
// import { Connection } from './types';
const _ = require("lodash");
const child_process_1 = require("child_process");
var duplex = require('duplexer');
const parser_1 = require("./parser");
class AutoConnectFailure extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.name = 'AutoConnectFailure';
        Error.captureStackTrace(this, AutoConnectFailure);
    }
}
exports.AutoConnectFailure = AutoConnectFailure;
class ConnectionError extends Error {
    constructor(message, conn) {
        super(message);
        this.conn = conn;
        this.message = message;
        this.conn = conn;
        this.name = 'ConnectionError';
        Error.captureStackTrace(this, ConnectionError);
    }
}
exports.ConnectionError = ConnectionError;
// export class Connection {
//     readonly uri: string;
//     public version: {
//         raw: string;
//         sem: string;
//     }
//
//     // private connected: boolean;
//     // private stream: Duplex;
//
//     constructor(uri: string) {
//         this.uri = uri;
//     }
// }
class Connector {
    constructor(core) {
        this.core = core;
        this.connections = [];
        autoConnect()
            .then(validate)
            .then(connect)
            .then((conn) => {
            console.log(conn);
            this.connections.push(conn);
            // conn.stream.on('data', (data) => {
            //     console.log(data.toString());
            // });
        }).catch(AutoConnectFailure, (err) => {
            console.error(err);
        }).catch(ConnectionError, (err) => {
            console.error(err);
        }).catch((err) => {
            console.error(err);
        });
    }
}
exports.default = Connector;
// automatically searches for available Agda connections
function autoConnect() {
    if (process.platform === 'win32') {
        return Promise.reject(new AutoConnectFailure('on windows'));
    }
    return new Promise((resolve, reject) => {
        child_process_1.exec(`which agda`, (error, stdout, stderr) => {
            if (error) {
                reject(new AutoConnectFailure(error.toString()));
            }
            else {
                resolve({
                    uri: parser_1.parseFilepath(stdout)
                });
            }
        });
    });
}
function validate(conn) {
    return new Promise((resolve, reject) => {
        child_process_1.exec(`${conn.uri} --version`, (error, stdout, stderr) => {
            if (conn.uri === '') {
                return reject(new ConnectionError(`The path must not be empty`, conn));
            }
            if (error) {
                console.error(error);
                return reject(new ConnectionError(`Unable to execute the given command`, conn));
            }
            if (stderr) {
                const message = `Spawned process returned with the following result (from stderr):\n\"${stdout.toString()}\"`;
                return reject(new ConnectionError(message, conn));
            }
            const result = stdout.toString().match(/^Agda version (.*)(?:\r\n?|\n)$/);
            if (result) {
                // normalize version number to valid semver
                const rawVerNum = result[1];
                const semVerNum = _.take((result[1] + '.0.0.0').replace('-', '.').split('.'), 3).join('.');
                conn.version = {
                    raw: rawVerNum,
                    sem: semVerNum
                };
                resolve(conn);
            }
            else {
                const message = `Spawned process returned with the following result (from stdout):\n\"${stdout.toString()}\"`;
                reject(new ConnectionError(message, conn));
            }
        });
    });
}
function connect(conn) {
    return new Promise((resolve, reject) => {
        const agdaProcess = child_process_1.spawn(conn.uri, ['--interaction']);
        agdaProcess.on('error', (error) => {
            reject(new ConnectionError(error.message, conn));
        });
        agdaProcess.on('close', (signal) => {
            reject(new ConnectionError(`exit with signal ${signal}`, conn));
        });
        conn.stream = duplex(agdaProcess.stdin, agdaProcess.stdout);
        resolve(conn);
    });
}
//# sourceMappingURL=connector.js.map
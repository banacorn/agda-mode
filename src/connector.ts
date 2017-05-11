import * as Promise from 'bluebird';
import * as _ from 'lodash';
import { spawn, exec, ChildProcess } from 'child_process';
import { Duplex } from 'stream';
var duplex = require('duplexer');

declare var atom: any;

import { Connection } from './type';
import { guid } from './util';
import Core from './core';
import { parseFilepath } from './parser';
import * as Action from "./view/actions";


export class AutoConnectFailure extends Error {
    constructor(message: string) {
        super(message);
        this.message = message;
        this.name = 'AutoConnectFailure';
        Error.captureStackTrace(this, AutoConnectFailure);
    }
}

export class ConnectionError extends Error {
    constructor(message: string, public conn?: Connection) {
        super(message);
        this.message = message;
        this.conn = conn;
        this.name = 'ConnectionError';
        Error.captureStackTrace(this, ConnectionError);
    }
}

export default class Connector {
    // private markers: any[];
    // public connections: Connection[];

    constructor(private core: Core) {

        // initialize previous connections
        // this.connections = [];

        // console.log(this.getConnections());
        // this.connect()
        //     .then((conn) => {
        //         // console.log(conn)
        //         this.addConnection(conn);
        //         conn.stream.on('data', (data) => {
        //             console.log(data.toString());
        //         });
        //     }).catch(AutoConnectFailure, (err) => {
        //         console.error(err);
        //         // this.core.view.store.dispatch(Action.CONNECTION.showSetupView(true));
        //     }).catch(ConnectionError, (err) => {
        //         console.error(err);
        //     }).catch((err) => {
        //         console.error(err);
        //     });
    }

    connect(): Promise<Connection> {
        const previousConnections = getConnections();

        if (previousConnections.length === 0) {
            return autoConnect()
                .then(validate)
                .then(connect)
                // .catch(AutoConnectFailure, (err) => {
                //     console.log(this.core.view.store.dispatch(Action.CONNECTION.setupView(true)));
                //     // console.warn(err.message);
                // });
        } else {
            return Promise.resolve(previousConnections[0]);
        }
    }
}

//
// export function connect(): Promise<Connection> {
//     const previousConnections = getConnections();
//
//     if (previousConnections.length === 0) {
//         return autoConnect()
//             .then(validate)
//             .then(connect)
//             // .catch(AutoConnectFailure, (err) => {
//             //     console.log(this.core.view.store.dispatch(Action.CONNECTION.setupView(true)));
//             //     // console.warn(err.message);
//             // });
//     } else {
//         return Promise.resolve(previousConnections[0]);
//     }
// }

export function getConnections(): Connection[] {
    const state = atom.config.get('agda-mode.internalState');
    return JSON.parse(state).connections;
}

export function mkConnection(uri: string): Connection {
    return {
        guid: guid(),
        uri: parseFilepath(uri)
    }
}

// automatically searches for available Agda connections
export function autoConnect(): Promise<Connection> {
    if (process.platform === 'win32') {
        return Promise.reject(new AutoConnectFailure('win32'));
    }

    return new Promise<Connection>((resolve, reject) => {
        exec(`which mama`, (error, stdout, stderr) => {
            if (error) {
                reject(new AutoConnectFailure(error.toString()));
            } else {
                resolve(mkConnection(stdout));
            }
        });
    });
}

export function validate(conn: Connection): Promise<Connection> {
    return new Promise<Connection>((resolve, reject) => {
        exec(`${conn.uri} --version`, (error, stdout, stderr) => {

            if (conn.uri === '') {
                return reject(new ConnectionError(`The path must not be empty`, conn));
            }

            if (error) {
                // command not found
                if (error.message.toString().match(/command not found/)) {
                    return reject(new ConnectionError(`Unable to connect the given executable:\n${error.message}`, conn));
                // command found however the arguments are invalid
                } else {
                    return reject(new ConnectionError(`This doesn't seem like Agda:\n${error.message}`, conn));
                }
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
            } else {
                const message = `Doesn't seem like Agda to me: \n\"${stdout.toString()}\"`;
                reject(new ConnectionError(message, conn));
            }
        });
    });
}

export function connect(conn: Connection): Promise<Connection> {
    return new Promise<Connection>((resolve, reject) => {
        const agdaProcess = spawn(conn.uri, ['--interaction']);
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

export function close(conn: Connection) {
    conn.stream.end();
}

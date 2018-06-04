import * as Promise from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import { inspect } from 'util';
import { spawn, exec, ChildProcess } from 'child_process';
import { Duplex } from 'stream';
var duplex = require('duplexer');

import Rectifier from './parser/stream/rectifier';
import { View, Path, ValidPath, Version, Connection } from './type';
import * as Err from './error';
import { guid } from './util';
import { Core } from './core';
import { parseFilepath, parseResponses, parseFileType } from './parser';
import * as Action from "./view/actions";

export default class ConnectionManager {
    private connection?: Connection;

    constructor(private core: Core) {
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.getConnection = this.getConnection.bind(this);
        this.wire = this.wire.bind(this);
        this.queryPath = this.queryPath.bind(this);
        this.handleAgdaError = this.handleAgdaError.bind(this);
        this.handleLanguageServerError = this.handleLanguageServerError.bind(this);
        this.updateStore = this.updateStore.bind(this);
    }

    connect(): Promise<Connection> {
        return getAgdaPath()
            .catch(Err.Conn.NoPathGiven, error => {
                return autoSearch('agda');
            })
            .then(validateAgda)
            .catch(Err.Conn.Invalid, this.queryPath)
            .then(setAgdaPath)
            .then(this.updateStore)
            .then(establishConnection(this.core.editor.getPath()))
            .then(this.wire);
    }

    disconnect() {
        if (this.connection) {
            // the view
            this.core.view.store.dispatch(Action.CONNECTION.disconnectAgda());
            // the streams
            this.connection.stream.end();
            // the property
            this.connection = undefined;
        }
    }

    getConnection(): Promise<Connection> {
        if (this.connection)
            return Promise.resolve(this.connection);
        else
            return Promise.reject(new Err.Conn.NotEstablished);
    }

    private wire = (connection: Connection): Promise<Connection> => {
        // the view
        this.core.view.store.dispatch(Action.CONNECTION.connectAgda({
            path: connection.path,
            version: connection.version
        }));
        // the properties
        this.connection = connection;
        // modify the method write so that we can intercept and redirect data to the core;
        const write = connection.stream.write;
        connection.stream.write = data => {
            this.core.view.store.dispatch(Action.PROTOCOL.logRequest({
                raw: data.toString(),
                parsed: null
            }));
            this.core.view.store.dispatch(Action.PROTOCOL.pending(true));
            return write(data);
        };
        // the streams
        connection.stream
            .pipe(new Rectifier)
            .on('data', (data) => {
                const promise = this.connection.queue.pop();
                const lines = data.toString().trim().split('\n');
                parseResponses(data.toString(), parseFileType(connection.filepath))
                    .then(responses => {
                        this.core.view.store.dispatch(Action.PROTOCOL.logResponses(responses.map((response, i) => ({
                            raw: lines[i],
                            parsed: response
                        }))));
                        this.core.view.store.dispatch(Action.PROTOCOL.pending(false));
                        promise.resolve(responses);
                    })
                    .catch(Err.ParseError, error => {
                        this.core.view.set('Parse Error', [error.message, error.raw], View.Style.Error);
                        promise.resolve([]);
                    })
                    .catch(error => {
                        this.handleAgdaError(error);
                        promise.resolve([]);
                    })
            });
        return Promise.resolve(connection);
    }

    queryPath(error: Error): Promise<ValidPath> {
        this.core.view.store.dispatch(Action.CONNECTION.startQuerying());
        this.core.view.store.dispatch(Action.CONNECTION.setAgdaMessage(error.message));
        this.core.view.set('Connection Error', [], View.Style.Error);
        return this.core.view.queryConnection()
            .then(validateAgda)
            .then(result => {
                this.core.view.store.dispatch(Action.CONNECTION.stopQuerying());
                return result;
            })
            .catch(Err.Conn.Invalid, this.queryPath);
    }

    handleAgdaError(error: Error) {
        this.core.view.set('Connection Error', [], View.Style.Error);
        return this.core.view.tabs.open('settings').then(() => {
            this.core.view.store.dispatch(Action.VIEW.navigate('/Connection'));
            this.core.view.store.dispatch(Action.CONNECTION.setAgdaMessage(error.message));
        });
    }

    handleLanguageServerError(error: Error) {
        this.core.view.set('Connection Error', [], View.Style.Error);
        return this.core.view.tabs.open('settings').then(() => {
            this.core.view.store.dispatch(Action.VIEW.navigate('/Connection'));
            this.core.view.store.dispatch(Action.CONNECTION.setLanguageServerMessage(error.message));
        });
    }

    updateStore(validated: ValidPath): Promise<ValidPath> {
        this.core.view.store.dispatch(Action.CONNECTION.connectAgda(validated));
        return Promise.resolve(validated);
    }
}

export function getAgdaPath(): Promise<Path> {
    const path = atom.config.get('agda-mode.agdaPath');
    if (path.trim() === '') {
        return Promise.reject(new Err.Conn.NoPathGiven);
    } else {
        return Promise.resolve(path);
    }
}

export function setAgdaPath(validated: ValidPath): Promise<ValidPath> {
    atom.config.set('agda-mode.agdaPath', validated.path);
    return Promise.resolve(validated);
}

export function setLanguageServerPath(validated: ValidPath): Promise<ValidPath> {
    atom.config.set('agda-mode.languageServerPath', validated.path);
    return Promise.resolve(validated);
}

export function autoSearch(path: string): Promise<string> {
    if (process.platform === 'win32') {
        return Promise.reject(new Err.Conn.AutoSearchError('Unable to locate Agda on Windows systems', path));
    }

    return new Promise<string>((resolve, reject) => {
        exec(`which ${path}`, (error, stdout, stderr) => {
            if (error) {
                reject(new Err.Conn.AutoSearchError(`Cannot find "${path}".\nLocating "${path}" in the user's path with 'which' but failed with the following error message: ${error.toString()}`, path));
            } else {
                resolve(parseFilepath(stdout));
            }
        });
    });
}


// to make sure that we are connecting with the right thing
export function validateProcess(path: Path, validator: (msg: string, resolve, reject) => void): Promise<ValidPath> {
    path = parseFilepath(path);
    return new Promise<ValidPath>((resolve, reject) => {
        var stillHanging = true;

        if (path === '') {
            reject(new Err.Conn.Invalid(`The path must not be empty`, path));
        }
        // ask for the version and see if it's really Agda
        exec(`${path} --version`, (error, stdout, stderr) => {
            stillHanging = false;

            if (error) {
                // command not found
                if (error.message.toString().match(/command not found/)) {
                    reject(new Err.Conn.Invalid(`"${path}" was not found`, path));
                // command found however the arguments are invalid
                } else {
                    reject(new Err.Conn.Invalid(`Found something at "${path}" but it doesn't seem quite right:\n\n${error.message}`, path));
                }
            }
            if (stderr) {
                const message = `Spawned process returned with the following result (from stderr):\n\n\"${stdout.toString()}\"`;
                reject(new Err.Conn.Invalid(message, path));
            }

            validator(stdout.toString(), resolve, reject);
        });

        // wait for the process for about 1 sec, if it still does not
        // respond then reject
        setTimeout(() => {
            if (stillHanging) {
                const message = `The provided program hangs`;
                return Promise.reject(new Err.Conn.Invalid(message, path));
            }
        }, 1000)
    });
}

export function validateAgda(path: Path): Promise<ValidPath> {
    return validateProcess(path, (message, resolve, reject) => {
        const result = message.match(/^Agda version (.*)(?:\r\n?|\n)$/);
        if (result) {
            // normalize version number to valid semver
            const raw = result[1];
            const tokens = result[1].replace('-', '.').split('.');
            const sem = tokens.length > 3
                ? _.take(tokens, 3).join('.')
                : tokens.join('.');
            const version = { raw, sem };
            resolve({
                path,
                version
            });
        } else {
            reject(new Err.Conn.Invalid(`Found a program named "agda" but it doesn't seem like Agda to me`, path));
        }
    });
}

export function validateLanguageServer(path: Path): Promise<ValidPath> {
    return validateProcess(path, (message, resolve, reject) => {
        const result = message.match(/^Agda Languege Server version (.*)(?:\r\n?|\n)$/);
        if (result) {
            // normalize version number to valid semver
            const raw = result[1];
            const tokens = result[1].replace('-', '.').split('.');
            const sem = tokens.length > 3
                ? _.take(tokens, 3).join('.')
                : tokens.join('.');
            const version = { raw, sem };
            resolve({
                path,
                version
            });
        } else {
            reject(new Err.Conn.Invalid(`Found a program named "agda-language-server" but it doesn't seem like one to me`, path));
        }
    });
}
export const establishConnection = (filepath: string) => ({ path, version }: ValidPath): Promise<Connection> => {
    return new Promise<Connection>((resolve, reject) => {
        const agdaProcess = spawn(path, ['--interaction'], { shell: true });
        agdaProcess.on('error', (error) => {
            reject(new Err.Conn.ConnectionError(
                error.message,
                path
            ));
        });
        agdaProcess.on('close', (signal) => {
            const message = signal === 127 ?
                `exit with signal ${signal}, Agda is not found`:
                `exit with signal ${signal}`;
            reject(new Err.Conn.ConnectionError(
                message,
                path
            ));
        });
        // validate the spawned process
        agdaProcess.stdout.once('data', (data) => {
            const okay = data.toString().match(/^Agda2\>/);
            if (okay) {
                resolve({
                    path,
                    version,
                    stream: duplex(agdaProcess.stdin, agdaProcess.stdout),
                    queue: [],
                    filepath
                });
            } else {
                reject(new Err.Conn.ConnectionError(
                    data.toString().replace('\\n', '\n'),
                    path
                ));
            }
        });
    });
}

import * as Promise from 'bluebird';
import * as _ from 'lodash';
import { spawn, exec } from 'child_process';
var duplex = require('duplexer');

import { View, Agda } from './type';
import { Path, ValidPath, Connection } from './type/connection';

import * as Err from './error';
import { Core } from './core';

import EmacsRectifier from './parser/emacs/stream/rectifier';
import JSONRectifier from './parser/json/rectifier';
import * as Emacs from './parser/emacs';
import * as J from './parser/json';
import { parseFilepath, parseFileType }  from './parser';

import * as Action from "./view/actions";

export default class ConnectionManager {
    private connection?: Connection;

    constructor(private core: Core) {
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.getConnection = this.getConnection.bind(this);
        this.wire = this.wire.bind(this);
        // this.queryPath = this.queryPath.bind(this);
        this.handleAgdaError = this.handleAgdaError.bind(this);
        this.updateStore = this.updateStore.bind(this);
    }

    connect(): Promise<Connection> {
        return getAgdaPath()
            .catch(Err.Conn.NoPathGiven, () => {
                return autoSearch('agda');
            })
            .then(validateAgda)
            // .catch(Err.Conn.Invalid, this.queryPath)
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

    usesJSON(): boolean {
        if (this.connection) {
            return useJSON(this.connection);
        } else {
            return false
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
        this.core.view.store.dispatch(Action.CONNECTION.connectAgda(connection));
        // the properties
        this.connection = connection;

        if (this.usesJSON()) {
            connection.stream
                .pipe(new JSONRectifier)
                .on('data', (objs: object[]) => {
                    const promise = this.connection && this.connection.queue.pop();
                    // console.log(promise);
                    if (promise) {
                        objs.map

                        return Promise.map(objs, (obj) => J.parseResponse(obj, parseFileType(connection.filepath)))
                            .then(responses => {
                                const resps = responses
                                    .map((response, i) => ({
                                        raw: JSON.stringify(objs[i]),
                                        parsed: response
                                    }))
                                    .filter(({ parsed }) => parsed.kind !== "RunningInfo")  // don't log RunningInfo because there's too many of them
                                this.core.view.store.dispatch(Action.PROTOCOL.logResponses(resps));
                                this.core.view.isPending(false);
                                promise.resolve(responses);
                            })
                            .catch(Err.ParseError, error => {
                                this.core.view.setPlainText('Parse Error', `${error.message}\n${error.raw}`, 'error');
                                promise.resolve([]);
                            })
                            .catch(error => {
                                this.handleAgdaError(error);
                                promise.resolve([]);
                            })
                    }
                });
        } else {
            connection.stream
                .pipe(new EmacsRectifier)
                .on('data', (data) => {
                    const promise = this.connection && this.connection.queue.pop();
                    if (promise) {
                        const lines = data.toString().trim().split('\n');
                        Emacs.parseResponses(data.toString(), parseFileType(connection.filepath))
                            .then(responses => {
                                const resps: View.Parsed<Agda.Response>[] = responses
                                    .map((response, i) => ({
                                        raw: lines[i],
                                        parsed: response
                                    }))
                                    .filter(({ parsed }) => parsed.kind !== "RunningInfo")  // don't log RunningInfo because there's too many of them
                                this.core.view.store.dispatch(Action.PROTOCOL.logResponses(resps));
                                this.core.view.isPending(false);
                                promise.resolve(responses);
                            })
                            .catch(Err.ParseError, error => {
                                this.core.view.setPlainText('Parse Error', `${error.message}\n${error.raw}`, 'error');
                                promise.resolve([]);
                            })
                            .catch(error => {
                                this.handleAgdaError(error);
                                promise.resolve([]);
                            })
                    }
                });
        }
        return Promise.resolve(connection);
    }

    // queryPath(error: Error): Promise<ValidPath> {
    //     this.core.view.store.dispatch(Action.CONNECTION.startQuerying());
    //     this.core.view.store.dispatch(Action.CONNECTION.setAgdaMessage(error.message));
    //     this.core.view.setPlainText('Connection Error', '', 'error');
    //     return this.core.view.queryConnection()
    //         .then(validateAgda)
    //         .then(result => {
    //             this.core.view.store.dispatch(Action.CONNECTION.stopQuerying());
    //             return result;
    //         })
    //         .catch(Err.Conn.Invalid, this.queryPath);
    // }

    handleAgdaError(error: Error) {
        // temp hack
        const translateReasonError = (err) => {
            if (_.isArray(err) && _.isArray(err[1]) && _.isString(err[1][0])) {
                return _.last(err[1][0].split("."));
            } else {
                return err.name;
            }
        };
        const errorName = translateReasonError(error);

        this.core.view.setPlainText(errorName, '', 'error');
        switch (errorName) {
            case 'QueryCancelled':   return Promise.resolve();
            default:
                this.disconnect();
                console.warn(error);
                // return this.core.view.tabs.open('settings').then(() => {
                //     this.core.view.store.dispatch(Action.VIEW.navigate({path: '/Connection'}));
                //     this.core.view.store.dispatch(Action.CONNECTION.setAgdaMessage(error.message));
                // });
        }
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

export function autoSearch(path: string): Promise<string> {
    if (process.platform === 'win32') {
        return Promise.reject(new Err.Conn.AutoSearchError('Unable to locate Agda on Windows systems', path));
    }

    return new Promise<string>((resolve, reject) => {
        exec(`which ${path}`, (error, stdout) => {
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
        exec(`${path}`, (error, stdout, stderr) => {
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
        const result = message.match(/Agda version (.*)/);
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
                version,
                supportedProtocol: message.match(/--interaction-json/) ? ['JSON', 'Emacs'] : ['Emacs']
            });
        } else {
            reject(new Err.Conn.Invalid(`Found a program named "agda" but it doesn't seem like Agda to me`, path));
        }
    });
}

export const establishConnection = (filepath: string) => ({ path, version, supportedProtocol }: ValidPath): Promise<Connection> => {
    return new Promise<Connection>((resolve, reject) => {
        const option = useJSON({ path, version, supportedProtocol }) ? ['--interaction-json'] : ['--interaction']
        const agdaProcess = spawn(path, option, { shell: true });
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
        // stream the incoming data to the parser
        agdaProcess.stdout.once('data', () => {
            resolve({
                path,
                version,
                supportedProtocol,
                stream: duplex(agdaProcess.stdin, agdaProcess.stdout),
                queue: [],
                filepath
            });
        });
    });
}

const useJSON = ({ supportedProtocol } : ValidPath) : boolean => {
    return (atom.config.get('agda-mode.enableJSONProtocol') && _.includes(supportedProtocol, 'JSON')) || false;
}

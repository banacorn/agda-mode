"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const child_process_1 = require("child_process");
var duplex = require('duplexer');
const rectifier_1 = require("./parser/stream/rectifier");
const error_1 = require("./error");
const util_1 = require("./util");
const parser_1 = require("./parser");
const Action = require("./view/actions");
const Store = require("./persist");
class Connector {
    constructor(core) {
        this.core = core;
        //
        this.wire = (conn) => {
            // the view
            this.core.view.store.dispatch(Action.CONNECTION.connect(this.selected.guid));
            // the properties
            this.connection = conn;
            // modify the method write so that we can intercept and redirect data to the core;
            const write = conn.stream.write;
            conn.stream.write = data => {
                this.core.view.store.dispatch(Action.PROTOCOL.logRequest({
                    raw: data.toString(),
                    parsed: null
                }));
                return write(data);
            };
            // the streams
            conn.stream
                .pipe(new rectifier_1.default)
                .on('data', (data) => {
                const promise = this.connection.queue.pop();
                const lines = data.toString().trim().split('\n');
                parser_1.parseResponses(data.toString())
                    .then(responses => {
                    this.core.view.store.dispatch(Action.PROTOCOL.logResponses(responses.map((response, i) => ({
                        raw: lines[i],
                        parsed: response
                    }))));
                    promise.resolve(responses);
                })
                    .catch(error_1.ParseError, error => {
                    this.core.view.set('Parse Error', [error.message, error.raw], 3 /* Error */);
                    promise.resolve([]);
                })
                    .catch(error => {
                    this.core.view.set('Error', [error.message], 3 /* Error */);
                    promise.resolve([]);
                });
                // try {
                //     this.core.view.store.dispatch(Action.PROTOCOL.addResponse(data.toString()));
                //     const response = parseResponse(data.toString());
                //     handleResponse(this.core, response);
                // } catch (error) {
                //     // this.core.view.store.dispatch(Action.CONNECTION.err(this.selected.guid));
                //     console.log(error)
                //     // show some message
                //     this.core.view.set('Agda Parse Error',
                //         [`Message from agda:`].concat(data.toString()),
                //         View.Style.Error);
                // }
            });
            return Promise.resolve(conn);
        };
    }
    // select a target ConnectionInfo to be connected
    select(connInfo) {
        this.selected = connInfo;
    }
    unselect(connInfo) {
        if (this.selected && this.selected.guid === connInfo.guid) {
            this.selected = undefined;
        }
        if (this.connection && this.connection.guid === connInfo.guid) {
            this.disconnect();
        }
    }
    // connect with the selected ConnectionInfo
    connect() {
        if (!this.selected) {
            return getExistingConnectionInfo()
                .then(selected => {
                this.selected = selected;
                if (selected.languageServer) {
                    return connectLanguageServer(this.selected, this.core.getPath())
                        .then(this.wire);
                }
                else {
                    return connectAgda(this.selected, this.core.getPath())
                        .then(this.wire);
                }
            })
                .catch(error_1.ConnectionError, error => {
                switch (error.kind) {
                    case 'NoExistingConnections':
                        return autoSearch('agda')
                            .then(validateAgda)
                            .then(mkConnectionInfo)
                            .then(connInfo => {
                            // let it be selected
                            this.selected = connInfo;
                            // update the view
                            this.core.view.store.dispatch(Action.CONNECTION.addConnection(connInfo));
                            return connectAgda(connInfo, this.core.getPath())
                                .then(this.wire);
                        });
                    case 'AutoSearchFailure':
                    default:
                        return this.queryConnection();
                }
            });
        }
        // only recoonect when the selected is different from the connected
        if (this.connection && this.connection.guid === this.selected.guid) {
            // there's no need of re-establish a new connection
            return Promise.resolve(this.connection);
        }
        else {
            // cut the old connection
            this.disconnect();
            // and establish a new one
            return connectAgda(this.selected, this.core.getPath())
                .then(this.wire);
        }
    }
    // disconnect the current connection
    disconnect() {
        if (this.connection) {
            // the view
            this.core.view.store.dispatch(Action.CONNECTION.disconnect(this.connection.guid));
            // the streams
            this.connection.stream.end();
            // the property
            this.connection = undefined;
        }
    }
    getConnection() {
        if (this.connection)
            return Promise.resolve(this.connection);
        else
            return Promise.reject(new error_1.ConnectionError('Connection not established', 'ConnectionNotEstablished'));
    }
    queryConnection() {
        return this.core.view.queryConnection()
            .then(validateAgda)
            .then(mkConnectionInfo)
            .then(connInfo => {
            // let it be selected
            this.selected = connInfo;
            // update the view
            this.core.view.store.dispatch(Action.CONNECTION.addConnection(connInfo));
            return connectAgda(connInfo, this.core.getPath())
                .then(this.wire);
        })
            .catch(error_1.ConnectionError, (error) => {
            console.log(error);
            // this.queryConnection();
        });
    }
}
exports.default = Connector;
function getExistingConnectionInfo() {
    const state = Store.get();
    const selected = _.find(state.connections, {
        guid: state.selected
    });
    if (selected) {
        return Promise.resolve(selected);
    }
    else {
        if (state.connections.length > 0) {
            return Promise.resolve(state.connections[0]);
        }
        else {
            return Promise.reject(new error_1.ConnectionError('No existing connections available', 'NoExistingConnections'));
        }
    }
}
exports.getExistingConnectionInfo = getExistingConnectionInfo;
function mkConnectionInfo(agda) {
    return {
        guid: util_1.guid(),
        agda: agda
    };
}
exports.mkConnectionInfo = mkConnectionInfo;
function autoSearch(filepath) {
    if (process.platform === 'win32') {
        return Promise.reject(new error_1.ConnectionError('Unable to locate Agda on Windows systems now', 'AutoSearchFailure'));
    }
    return new Promise((resolve, reject) => {
        child_process_1.exec(`which ${filepath}`, (error, stdout, stderr) => {
            if (error) {
                reject(new error_1.ConnectionError(`"which" failed with the following error message: ${error.toString()}`, 'AutoSearchFailure'));
            }
            else {
                resolve(parser_1.parseFilepath(stdout));
            }
        });
    });
}
exports.autoSearch = autoSearch;
function validateProcess(location, validator) {
    location = parser_1.parseFilepath(location);
    return new Promise((resolve, reject) => {
        var stillHanging = true;
        child_process_1.exec(`${location} --version`, (error, stdout, stderr) => {
            stillHanging = false;
            if (location === '') {
                return reject(new error_1.ConnectionError(`The location must not be empty`, 'ValidationError', location));
            }
            if (error) {
                // command not found
                if (error.message.toString().match(/command not found/)) {
                    return reject(new error_1.ConnectionError(`Unable to connect the given executable:\n${error.message}`, 'ValidationError', location));
                    // command found however the arguments are invalid
                }
                else {
                    return reject(new error_1.ConnectionError(`The provided program doesn't seem like Agda:\n\n${error.message}`, 'ValidationError', location));
                }
            }
            if (stderr) {
                const message = `Spawned process returned with the following result (from stderr):\n\"${stdout.toString()}\"`;
                return reject(new error_1.ConnectionError(message, 'ValidationError', location));
            }
            validator(stdout.toString(), resolve, reject);
        });
        // wait for the process for about 1 sec, if it still does not
        // respond then reject
        setTimeout(() => {
            if (stillHanging) {
                const message = `The provided program hangs`;
                reject(new error_1.ConnectionError(message));
            }
        }, 1000);
    });
}
exports.validateProcess = validateProcess;
function validateAgda(location) {
    return validateProcess(location, (message, resolve, reject) => {
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
                location,
                version
            });
        }
        else {
            reject(new error_1.ConnectionError(`The provided program doesn't seem like Agda:\n ${message}`, 'ValidationError', location));
        }
    });
}
exports.validateAgda = validateAgda;
function validateLanguageServer(location) {
    return validateProcess(location, (message, resolve, reject) => {
        const result = message.match(/^Agda Language Server (.*)(?:\r\n?|\n)$/);
        if (result) {
            resolve({
                location: location
            });
        }
        else {
            reject(new error_1.ConnectionError(`The provided program doesn't seem like Agda:\n ${message}`, 'ValidationError', location));
        }
    });
}
exports.validateLanguageServer = validateLanguageServer;
function connectAgda(connInfo, filepath) {
    return new Promise((resolve, reject) => {
        const agdaProcess = child_process_1.spawn(connInfo.agda.location, ['--interaction'], { shell: true });
        agdaProcess.on('error', (error) => {
            reject(new error_1.ConnectionError(error.message, 'Generic', connInfo.agda.location, connInfo.guid));
        });
        agdaProcess.on('close', (signal) => {
            reject(new error_1.ConnectionError(`exit with signal ${signal}`, 'Generic', connInfo.agda.location, connInfo.guid));
        });
        // validate the spawned process
        agdaProcess.stdout.once('data', (data) => {
            const result = data.toString().match(/^Agda2\>/);
            if (result) {
                resolve(Object.assign({}, connInfo, { stream: duplex(agdaProcess.stdin, agdaProcess.stdout), queue: [], filepath }));
            }
            else {
                reject(new error_1.ConnectionError(`The provided program doesn't seem like Agda:\n ${data.toString()}`, 'ValidationError', connInfo.agda.location, connInfo.guid));
            }
        });
    });
}
exports.connectAgda = connectAgda;
function connectLanguageServer(connInfo, filepath) {
    return new Promise((resolve, reject) => {
        const languageServerProcess = child_process_1.spawn(connInfo.languageServer.location, [], { shell: true });
        languageServerProcess.on('error', (error) => {
            reject(new error_1.ConnectionError(error.message, 'Generic', connInfo.agda.location, connInfo.guid));
        });
        languageServerProcess.on('close', (signal) => {
            reject(new error_1.ConnectionError(`exit with signal ${signal}`, 'Generic', connInfo.agda.location, connInfo.guid));
        });
        languageServerProcess.stdout.once('data', (data) => {
            const result = data.toString().match(/^Agda2\>/);
            if (result) {
                resolve(Object.assign({}, connInfo, { stream: duplex(languageServerProcess.stdin, languageServerProcess.stdout), queue: [], filepath }));
            }
            else {
                reject(new error_1.ConnectionError(`The provided program doesn't seem like Agda:\n ${data.toString()}`, 'ValidationError', connInfo.agda.location, connInfo.guid));
            }
        });
    });
}
exports.connectLanguageServer = connectLanguageServer;
//# sourceMappingURL=connector.js.map
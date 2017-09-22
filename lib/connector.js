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
// Custom Errors
class NoConnectionGiven extends Error {
    constructor() {
        super('');
        this.message = '';
        this.name = 'NoConnectionGiven';
        Error.captureStackTrace(this, NoConnectionGiven);
    }
}
exports.NoConnectionGiven = NoConnectionGiven;
class AutoSearchFailure extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.name = 'AutoSearchFailure';
        Error.captureStackTrace(this, AutoSearchFailure);
    }
}
exports.AutoSearchFailure = AutoSearchFailure;
class ConnectionError extends Error {
    constructor(message, location, guid) {
        super(message);
        this.location = location;
        this.guid = guid;
        this.message = message;
        this.location = location;
        this.guid = guid;
        this.name = 'Connection Error';
        Error.captureStackTrace(this, ConnectionError);
    }
}
exports.ConnectionError = ConnectionError;
class NoExistingConnections extends Error {
    constructor() {
        super('');
        this.message = '';
        this.name = 'NoExistingConnections';
        Error.captureStackTrace(this, NoExistingConnections);
    }
}
exports.NoExistingConnections = NoExistingConnections;
class ConnectionNotEstablished extends Error {
    constructor() {
        super('');
        this.message = 'Connection not established yet';
        this.name = 'ConnectionNotEstablished';
        Error.captureStackTrace(this, ConnectionNotEstablished);
    }
}
exports.ConnectionNotEstablished = ConnectionNotEstablished;
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
                this.core.view.store.dispatch(Action.PROTOCOL.addRequest(data.toString()));
                return write(data);
            };
            // the streams
            conn.stream
                .pipe(new rectifier_1.default)
                .on('data', (data) => {
                const lines = data.toString().trim().split('\n');
                const promise = this.connection.queue.pop();
                Promise.map(lines, parser_1.parseAgdaResponse)
                    .then(responses => {
                    responses.map((response, i) => {
                        this.core.view.store.dispatch(Action.PROTOCOL.addResponse({
                            raw: lines[i],
                            parsed: response
                        }));
                    });
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
                //     const response = parseAgdaResponse(data.toString());
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
                .catch(NoExistingConnections, () => {
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
            })
                .catch(AutoSearchFailure, () => {
                return this.queryConnection();
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
            return Promise.reject(new ConnectionNotEstablished);
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
            .catch(NoConnectionGiven, () => {
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
            return Promise.reject(new NoExistingConnections);
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
        return Promise.reject(new AutoSearchFailure('win32'));
    }
    return new Promise((resolve, reject) => {
        child_process_1.exec(`which ${filepath}`, (error, stdout, stderr) => {
            if (error) {
                reject(new AutoSearchFailure(error.toString()));
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
                return reject(new ConnectionError(`The location must not be empty`, location));
            }
            if (error) {
                // command not found
                if (error.message.toString().match(/command not found/)) {
                    return reject(new ConnectionError(`Unable to connect the given executable:\n${error.message}`, location));
                    // command found however the arguments are invalid
                }
                else {
                    return reject(new ConnectionError(`This doesn't seem like Agda:\n${error.message}`, location));
                }
            }
            if (stderr) {
                const message = `Spawned process returned with the following result (from stderr):\n\"${stdout.toString()}\"`;
                return reject(new ConnectionError(message, location));
            }
            validator(stdout.toString(), resolve, reject);
        });
        // wait for the process for about 1 sec, if it still does not
        // respond then reject
        setTimeout(() => {
            if (stillHanging) {
                const message = `The provided program hangs`;
                reject(new ConnectionError(message, location));
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
            reject(new ConnectionError(`Doesn't seem like Agda to me: \n\"${message}\"`, location));
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
            reject(new ConnectionError(`Doesn't seem like Agda to me: \n\"${message}\"`, location));
        }
    });
}
exports.validateLanguageServer = validateLanguageServer;
function connectAgda(connInfo, filepath) {
    return new Promise((resolve, reject) => {
        const agdaProcess = child_process_1.spawn(connInfo.agda.location, ['--interaction'], { shell: true });
        agdaProcess.on('error', (error) => {
            reject(new ConnectionError(error.message, connInfo.agda.location, connInfo.guid));
        });
        agdaProcess.on('close', (signal) => {
            reject(new ConnectionError(`exit with signal ${signal}`, connInfo.agda.location, connInfo.guid));
        });
        // validate the spawned process
        agdaProcess.stdout.once('data', (data) => {
            const result = data.toString().match(/^Agda2\>/);
            if (result) {
                resolve(Object.assign({}, connInfo, { stream: duplex(agdaProcess.stdin, agdaProcess.stdout), queue: [], filepath }));
            }
            else {
                reject(new ConnectionError(`doesn't act like agda: ${data.toString()}`, connInfo.agda.location, connInfo.guid));
            }
        });
    });
}
exports.connectAgda = connectAgda;
function connectLanguageServer(connInfo, filepath) {
    return new Promise((resolve, reject) => {
        const languageServerProcess = child_process_1.spawn(connInfo.languageServer.location, [], { shell: true });
        languageServerProcess.on('error', (error) => {
            reject(new ConnectionError(error.message, connInfo.agda.location, connInfo.guid));
        });
        languageServerProcess.on('close', (signal) => {
            reject(new ConnectionError(`exit with signal ${signal}`, connInfo.agda.location, connInfo.guid));
        });
        languageServerProcess.stdout.once('data', (data) => {
            const result = data.toString().match(/^Agda2\>/);
            if (result) {
                resolve(Object.assign({}, connInfo, { stream: duplex(languageServerProcess.stdin, languageServerProcess.stdout), queue: [], filepath }));
            }
            else {
                reject(new ConnectionError(`doesn't act like agda: ${data.toString()}`, connInfo.agda.location, connInfo.guid));
            }
        });
    });
}
exports.connectLanguageServer = connectLanguageServer;
//# sourceMappingURL=connector.js.map
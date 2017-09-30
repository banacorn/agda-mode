"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const child_process_1 = require("child_process");
var duplex = require('duplexer');
const rectifier_1 = require("./parser/stream/rectifier");
const Err = require("./error");
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
                    .catch(Err.ParseError, error => {
                    this.core.view.set('Parse Error', [error.message, error.raw], 3 /* Error */);
                    promise.resolve([]);
                })
                    .catch(error => {
                    this.handleError(error);
                    promise.resolve([]);
                });
            });
            return Promise.resolve(conn);
        };
        this.recoverAgda = this.recoverAgda.bind(this);
        this.handleError = this.handleError.bind(this);
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
                return connectAgda(this.selected, this.core.getPath())
                    .then(this.wire);
                // if (selected.languageServer) {
                //     return connectLanguageServer(this.selected, this.core.getPath())
                //         .then(this.wire);
                // } else {
                //     return connectAgda(this.selected, this.core.getPath())
                //         .then(this.wire);
                // }
            })
                .catch(Err.Conn.NoCandidates, error => {
                return autoSearch('agda')
                    .then(validateAgda)
                    .catch(Err.Conn.Invalid, this.recoverAgda)
                    .then(mkConnectionInfo)
                    .then(connInfo => {
                    // let it be selected
                    this.selected = connInfo;
                    // update the view
                    this.core.view.store.dispatch(Action.CONNECTION.addConnection(connInfo));
                    return connectAgda(connInfo, this.core.getPath())
                        .then(this.wire);
                });
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
            throw new Err.Conn.NotEstablished;
    }
    recoverAgda() {
        return this.core.view.queryConnection()
            .then(validateAgda)
            .catch(Err.Conn.Invalid, this.recoverAgda);
    }
    handleError(error) {
        this.core.view.set('Error', [error.message], 3 /* Error */);
        this.core.view.store.dispatch(Action.CONNECTION.err(this.selected.guid));
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
            throw new Err.Conn.NoCandidates;
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
function autoSearch(location) {
    if (process.platform === 'win32') {
        throw new Err.Conn.AutoSearchError('Unable to locate Agda on Windows systems', location);
    }
    return new Promise((resolve, reject) => {
        child_process_1.exec(`which ${location}`, (error, stdout, stderr) => {
            if (error) {
                reject(new Err.Conn.AutoSearchError(`"which" failed with the following error message: ${error.toString()}`, location));
            }
            else {
                resolve(parser_1.parseFilepath(stdout));
            }
        });
    });
}
exports.autoSearch = autoSearch;
// to make sure that we are connecting with Agda
function validateProcess(location, validator) {
    location = parser_1.parseFilepath(location);
    return new Promise((resolve, reject) => {
        var stillHanging = true;
        if (location === '') {
            reject(new Err.Conn.Invalid(`The location must not be empty`, location));
        }
        // ask for the version and see if it's really Agda
        child_process_1.exec(`${location} --version`, (error, stdout, stderr) => {
            stillHanging = false;
            if (error) {
                // command not found
                if (error.message.toString().match(/command not found/)) {
                    reject(new Err.Conn.Invalid(`The provided program was not found`, location));
                    // command found however the arguments are invalid
                }
                else {
                    reject(new Err.Conn.Invalid(`The provided program doesn't seem like Agda:\n\n${error.message}`, location));
                }
            }
            if (stderr) {
                const message = `Spawned process returned with the following result (from stderr):\n\n\"${stdout.toString()}\"`;
                reject(new Err.Conn.Invalid(message, location));
            }
            validator(stdout.toString(), resolve, reject);
        });
        // wait for the process for about 1 sec, if it still does not
        // respond then reject
        setTimeout(() => {
            if (stillHanging) {
                const message = `The provided program hangs`;
                return Promise.reject(new Err.Conn.Invalid(message, location));
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
            reject(new Err.Conn.Invalid(`The provided program doesn't seem like Agda`, location));
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
            reject(new Err.Conn.Invalid(`The provided program doesn't seem like Agda Language Server`, location));
        }
    });
}
exports.validateLanguageServer = validateLanguageServer;
function connectAgda(connInfo, filepath) {
    return new Promise((resolve, reject) => {
        const agdaProcess = child_process_1.spawn(connInfo.agda.location, ['--interaction'], { shell: true });
        agdaProcess.on('error', (error) => {
            reject(new Err.Conn.Connection(error.message, connInfo.agda.location, connInfo.guid));
        });
        agdaProcess.on('close', (signal) => {
            const message = signal === 127 ?
                `exit with signal ${signal}, Agda is not found` :
                `exit with signal ${signal}`;
            reject(new Err.Conn.Connection(message, connInfo.agda.location, connInfo.guid));
        });
        // validate the spawned process
        agdaProcess.stdout.once('data', (data) => {
            const result = data.toString().match(/^Agda2\>/);
            if (result) {
                resolve(Object.assign({}, connInfo, { stream: duplex(agdaProcess.stdin, agdaProcess.stdout), queue: [], filepath }));
            }
            else {
                reject(new Err.Conn.Connection(`The provided program doesn't seem like Agda:\n\n ${data.toString()}`, connInfo.agda.location, connInfo.guid));
            }
        });
    });
}
exports.connectAgda = connectAgda;
//# sourceMappingURL=connector.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const child_process_1 = require("child_process");
var duplex = require('duplexer');
const rectifier_1 = require("./parser/stream/rectifier");
const util_1 = require("./util");
const parser_1 = require("./parser");
const Action = require("./view/actions");
const Store = require("./persist");
const handler_1 = require("./handler");
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
    constructor(message, uri) {
        super(message);
        this.uri = uri;
        this.message = message;
        this.uri = uri;
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
                try {
                    this.core.view.store.dispatch(Action.PROTOCOL.addResponse(data.toString()));
                    const response = parser_1.parseAgdaResponse(data.toString());
                    handler_1.handleAgdaResponse(this.core, response);
                }
                catch (error) {
                    console.log(error);
                    // show some message
                    this.core.view.set('Agda Parse Error', [`Message from agda:`].concat(data.toString()), 3 /* Error */);
                }
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
                return connect(this.selected, this.core.getPath())
                    .then(this.wire);
            })
                .catch(NoExistingConnections, () => {
                return autoSearch()
                    .then(validate)
                    .then(connInfo => {
                    // let it be selected
                    this.selected = connInfo;
                    // update the view
                    this.core.view.store.dispatch(Action.CONNECTION.addConnection(connInfo));
                    return connect(connInfo, this.core.getPath())
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
            return connect(this.selected, this.core.getPath())
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
            .then(validate)
            .then(connInfo => {
            // let it be selected
            this.selected = connInfo;
            // update the view
            this.core.view.store.dispatch(Action.CONNECTION.addConnection(connInfo));
            return connect(connInfo, this.core.getPath())
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
function mkConnectionInfo(uri) {
    return {
        guid: util_1.guid(),
        uri: parser_1.parseFilepath(uri)
    };
}
exports.mkConnectionInfo = mkConnectionInfo;
function autoSearch() {
    if (process.platform === 'win32') {
        return Promise.reject(new AutoSearchFailure('win32'));
    }
    return new Promise((resolve, reject) => {
        child_process_1.exec(`which agda`, (error, stdout, stderr) => {
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
function validate(uri) {
    uri = parser_1.parseFilepath(uri);
    return new Promise((resolve, reject) => {
        child_process_1.exec(`${uri} --version`, (error, stdout, stderr) => {
            if (uri === '') {
                return reject(new ConnectionError(`The path must not be empty`, uri));
            }
            if (error) {
                // command not found
                if (error.message.toString().match(/command not found/)) {
                    return reject(new ConnectionError(`Unable to connect the given executable:\n${error.message}`, uri));
                    // command found however the arguments are invalid
                }
                else {
                    return reject(new ConnectionError(`This doesn't seem like Agda:\n${error.message}`, uri));
                }
            }
            if (stderr) {
                const message = `Spawned process returned with the following result (from stderr):\n\"${stdout.toString()}\"`;
                return reject(new ConnectionError(message, uri));
            }
            const result = stdout.toString().match(/^Agda version (.*)(?:\r\n?|\n)$/);
            if (result) {
                // normalize version number to valid semver
                const rawVerNum = result[1];
                const semVerNum = _.take((result[1] + '.0.0.0').replace('-', '.').split('.'), 3).join('.');
                let connInfo = mkConnectionInfo(uri);
                connInfo.version = {
                    raw: rawVerNum,
                    sem: semVerNum
                };
                resolve(connInfo);
            }
            else {
                const message = `Doesn't seem like Agda to me: \n\"${stdout.toString()}\"`;
                reject(new ConnectionError(message, uri));
            }
        });
    });
}
exports.validate = validate;
function connect(connInfo, filepath) {
    return new Promise((resolve, reject) => {
        const agdaProcess = child_process_1.spawn(connInfo.uri, ['--interaction'], { shell: true });
        agdaProcess.on('error', (error) => {
            reject(new ConnectionError(error.message, connInfo.uri));
        });
        agdaProcess.on('close', (signal) => {
            reject(new ConnectionError(`exit with signal ${signal}`, connInfo.uri));
        });
        agdaProcess.stdout.once('data', (data) => {
            const result = data.toString().match(/^Agda2\>/);
            if (result) {
                resolve(Object.assign({}, connInfo, { stream: duplex(agdaProcess.stdin, agdaProcess.stdout), filepath }));
            }
            else {
                reject(new ConnectionError(`doesn't act like agda: ${data.toString()}`, connInfo.uri));
            }
        });
    });
}
exports.connect = connect;
//# sourceMappingURL=connector.js.map
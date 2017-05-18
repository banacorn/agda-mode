"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const child_process_1 = require("child_process");
var duplex = require('duplexer');
const rectifier_1 = require("./parser/stream/rectifier");
const util_1 = require("./util");
const parser_1 = require("./parser");
const Store = require("./persist");
const handler_1 = require("./handler");
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
    constructor(message, uri) {
        super(message);
        this.uri = uri;
        this.message = message;
        this.uri = uri;
        this.name = 'ConnectionError';
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
class Connector {
    constructor(core) {
        this.core = core;
        this.wireStream = (conn) => {
            conn.stream
                .pipe(new rectifier_1.default)
                .on('data', (data) => {
                try {
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
        this.updateCurrentConnection = (conn) => {
            this.disconnect();
            this.current = conn;
            return Promise.resolve(conn);
        };
        // this.updateCurrentConnection = this.updateCurrentConnection.bind(this);
    }
    connect() {
        if (this.current) {
            return Promise.resolve(this.current);
        }
        else {
            return getExistingConnectionInfo()
                .catch(NoExistingConnections, err => {
                return autoSearch()
                    .then(validate);
            })
                .then(connInfo => {
                if (this.current && this.current.guid === connInfo.guid) {
                    return this.current;
                }
                else {
                    return connect(connInfo, this.core.getPath())
                        .then(this.updateCurrentConnection);
                }
            })
                .then(this.wireStream);
        }
    }
    disconnect() {
        if (this.current) {
            this.current.stream.end();
            this.current = undefined;
        }
    }
}
exports.default = Connector;
function getConnections() {
    return Store.get().connections;
}
exports.getConnections = getConnections;
function getPinnedConnection() {
    const state = Store.get();
    if (state.pinned) {
        return _.find(state.connections, {
            guid: state.pinned
        });
    }
    ``;
}
exports.getPinnedConnection = getPinnedConnection;
function getExistingConnectionInfo() {
    const pinned = getPinnedConnection();
    const connections = getConnections();
    if (pinned) {
        return Promise.resolve(pinned);
    }
    else {
        if (connections.length > 0) {
            return Promise.resolve(connections[0]);
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
        return Promise.reject(new AutoConnectFailure('win32'));
    }
    return new Promise((resolve, reject) => {
        child_process_1.exec(`which agda`, (error, stdout, stderr) => {
            if (error) {
                reject(new AutoConnectFailure(error.toString()));
            }
            else {
                resolve(parser_1.parseFilepath(stdout));
            }
        });
    });
}
exports.autoSearch = autoSearch;
function validate(uri) {
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
        const agdaProcess = child_process_1.spawn(connInfo.uri, ['--interaction']);
        agdaProcess.on('error', (error) => {
            reject(new ConnectionError(error.message, connInfo.uri));
        });
        agdaProcess.on('close', (signal) => {
            reject(new ConnectionError(`exit with signal ${signal}`, connInfo.uri));
        });
        resolve(Object.assign({}, connInfo, { stream: duplex(agdaProcess.stdin, agdaProcess.stdout), filepath }));
    });
}
exports.connect = connect;
function close(conn) {
    conn.stream.end();
}
exports.close = close;
//# sourceMappingURL=connector.js.map
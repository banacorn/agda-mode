"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const child_process_1 = require("child_process");
var duplex = require('duplexer');
const util_1 = require("./util");
const parser_1 = require("./parser");
const Store = require("./persist");
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
        // this.updateCurrentConnection = this.updateCurrentConnection.bind(this);
    }
    // select a target ConnectionInfo to be connected
    select(connInfo) {
    }
    // connect with the selected ConnectionInfo
    connect() {
    }
    // disconnect the current connection
    disconnect() {
    }
    getConnection() {
        return null;
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
// '/Users/banacorn/haskell/agda-builds/agda-2.6.0'
function connect(connInfo, filepath) {
    return new Promise((resolve, reject) => {
        const agdaProcess = child_process_1.spawn(connInfo.uri, ['--interaction'], { shell: true });
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
//# sourceMappingURL=connector.js.map
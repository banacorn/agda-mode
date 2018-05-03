"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const _ = require("lodash");
const child_process_1 = require("child_process");
var duplex = require('duplexer');
const rectifier_1 = require("./parser/stream/rectifier");
const Err = require("./error");
const parser_1 = require("./parser");
const Action = require("./view/actions");
class ConnectionManager {
    constructor(core) {
        this.core = core;
        //
        this.wire = (socket) => {
            // the view
            this.core.view.store.dispatch(Action.CONNECTION.connect(this.selected.guid));
            // the properties
            this.socket = socket;
            // modify the method write so that we can intercept and redirect data to the core;
            const write = socket.stream.write;
            socket.stream.write = data => {
                this.core.view.store.dispatch(Action.PROTOCOL.logRequest({
                    raw: data.toString(),
                    parsed: null
                }));
                this.core.view.store.dispatch(Action.PROTOCOL.pending(true));
                return write(data);
            };
            // the streams
            socket.stream
                .pipe(new rectifier_1.default)
                .on('data', (data) => {
                const promise = this.socket.queue.pop();
                const lines = data.toString().trim().split('\n');
                parser_1.parseResponses(data.toString())
                    .then(responses => {
                    this.core.view.store.dispatch(Action.PROTOCOL.logResponses(responses.map((response, i) => ({
                        raw: lines[i],
                        parsed: response
                    }))));
                    this.core.view.store.dispatch(Action.PROTOCOL.pending(false));
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
            return Promise.resolve(socket);
        };
        this.queryPath = this.queryPath.bind(this);
        this.handleError = this.handleError.bind(this);
    }
    // connect with the selected ConnectionInfo
    connect() {
        return getAgdaPath()
            .catch(Err.Conn.NoPathGiven, error => {
            return autoSearch('agda');
        })
            .then(validateAgda)
            .catch(Err.Conn.Invalid, this.queryPath)
            .then(exports.establishConnection(this.core.editor.getPath()))
            .then(this.wire);
    }
    // disconnect the current connection
    disconnect() {
        if (this.socket) {
            // // the view
            // this.core.view.store.dispatch(Action.CONNECTION.disconnect(this.socket.guid));
            // the streams
            this.socket.stream.end();
            // the property
            this.socket = undefined;
        }
    }
    getConnection() {
        if (this.socket)
            return Promise.resolve(this.socket);
        else
            return Promise.reject(new Err.Conn.NotEstablished);
    }
    queryPath() {
        return this.core.view.queryConnection()
            .then(validateAgda)
            .catch(Err.Conn.Invalid, this.queryPath);
    }
    handleError(error) {
        this.core.view.set('Error', [error.message], 3 /* Error */);
        if (this.selected) {
            this.core.view.store.dispatch(Action.CONNECTION.err(this.selected.guid));
        }
        else {
            this.core.view.store.dispatch(Action.CONNECTION.showNewConnectionView(true));
        }
    }
}
exports.default = ConnectionManager;
function getAgdaPath() {
    const path = atom.config.get('agda-mode.agdaPath');
    if (path.trim() === '') {
        return Promise.resolve(path);
    }
    else {
        return Promise.reject(new Err.Conn.NoPathGiven);
    }
}
exports.getAgdaPath = getAgdaPath;
function autoSearch(location) {
    if (process.platform === 'win32') {
        return Promise.reject(new Err.Conn.AutoSearchError('Unable to locate Agda on Windows systems', location));
    }
    return new Promise((resolve, reject) => {
        child_process_1.exec(`which ${location}`, (error, stdout, stderr) => {
            if (error) {
                reject(new Err.Conn.AutoSearchError(`Cannot find "${location}".\nLocating "${location}" in the user's path with 'which' but failed with the following error message: ${error.toString()}`, location));
            }
            else {
                resolve(parser_1.parseFilepath(stdout));
            }
        });
    });
}
exports.autoSearch = autoSearch;
// to make sure that we are connecting with Agda
function validateProcess(path, validator) {
    path = parser_1.parseFilepath(path);
    return new Promise((resolve, reject) => {
        var stillHanging = true;
        if (path === '') {
            reject(new Err.Conn.Invalid(`The location must not be empty`, path));
        }
        // ask for the version and see if it's really Agda
        child_process_1.exec(`${path} --version`, (error, stdout, stderr) => {
            stillHanging = false;
            if (error) {
                // command not found
                if (error.message.toString().match(/command not found/)) {
                    reject(new Err.Conn.Invalid(`The provided program was not found`, path));
                    // command found however the arguments are invalid
                }
                else {
                    reject(new Err.Conn.Invalid(`The provided program doesn't seem like Agda:\n\n${error.message}`, path));
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
        }, 1000);
    });
}
exports.validateProcess = validateProcess;
function validateAgda(path) {
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
        }
        else {
            reject(new Err.Conn.Invalid(`The provided program doesn't seem like Agda`, path));
        }
    });
}
exports.validateAgda = validateAgda;
//
// export function validateLanguageServer(path: Path): Promise<ValidPath> {
//     return validateProcess(path, (message, resolve, reject) => {
//         const result = message.match(/^Agda Language Server (.*)(?:\r\n?|\n)$/);
//         if (result) {
//             resolve({
//                 path: path
//             })
//         } else {
//             reject(new Err.Conn.Invalid(`The provided program doesn't seem like Agda Language Server`, location));
//         }
//     });
// }
exports.establishConnection = (filepath) => ({ path, version }) => {
    return new Promise((resolve, reject) => {
        const agdaProcess = child_process_1.spawn(path, ['--interaction'], { shell: true });
        agdaProcess.on('error', (error) => {
            reject(new Err.Conn.ConnectionError(error.message, path));
        });
        agdaProcess.on('close', (signal) => {
            const message = signal === 127 ?
                `exit with signal ${signal}, Agda is not found` :
                `exit with signal ${signal}`;
            reject(new Err.Conn.ConnectionError(message, path));
        });
        // validate the spawned process
        agdaProcess.stdout.once('data', (data) => {
            const result = data.toString().match(/^Agda2\>/);
            if (result) {
                resolve({
                    path,
                    version,
                    stream: duplex(agdaProcess.stdin, agdaProcess.stdout),
                    queue: [],
                    filepath
                });
            }
            else {
                reject(new Err.Conn.ConnectionError(`The provided program doesn't seem like Agda:\n\n ${data.toString()}`, path));
            }
        });
    });
};
//# sourceMappingURL=connection.js.map
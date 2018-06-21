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
        this.wire = (connection) => {
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
                return write(data);
            };
            // the streams
            connection.stream
                .pipe(new rectifier_1.default)
                .on('data', (data) => {
                const promise = this.connection && this.connection.queue.pop();
                if (promise) {
                    const lines = data.toString().trim().split('\n');
                    parser_1.parseResponses(data.toString(), parser_1.parseFileType(connection.filepath))
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
                        this.handleAgdaError(error);
                        promise.resolve([]);
                    });
                }
            });
            return Promise.resolve(connection);
        };
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.getConnection = this.getConnection.bind(this);
        this.wire = this.wire.bind(this);
        this.queryPath = this.queryPath.bind(this);
        this.handleAgdaError = this.handleAgdaError.bind(this);
        this.handleLanguageServerError = this.handleLanguageServerError.bind(this);
        this.updateStore = this.updateStore.bind(this);
    }
    connect() {
        return getAgdaPath()
            .catch(Err.Conn.NoPathGiven, error => {
            return autoSearch('agda');
        })
            .then(validateAgda)
            .catch(Err.Conn.Invalid, this.queryPath)
            .then(setAgdaPath)
            .then(this.updateStore)
            .then(exports.establishConnection(this.core.editor.getPath()))
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
    getConnection() {
        if (this.connection)
            return Promise.resolve(this.connection);
        else
            return Promise.reject(new Err.Conn.NotEstablished);
    }
    queryPath(error) {
        this.core.view.store.dispatch(Action.CONNECTION.startQuerying());
        this.core.view.store.dispatch(Action.CONNECTION.setAgdaMessage(error.message));
        this.core.view.set('Connection Error', [], 3 /* Error */);
        return this.core.view.queryConnection()
            .then(validateAgda)
            .then(result => {
            this.core.view.store.dispatch(Action.CONNECTION.stopQuerying());
            return result;
        })
            .catch(Err.Conn.Invalid, this.queryPath);
    }
    handleAgdaError(error) {
        this.core.view.set(error.name, [], 3 /* Error */);
        // don't invoke the settings view on QueryCancelled
        if (error.name === 'QueryCancelled') {
            return Promise.resolve();
        }
        else {
            return this.core.view.tabs.open('settings').then(() => {
                this.core.view.store.dispatch(Action.VIEW.navigate('/Connection'));
                this.core.view.store.dispatch(Action.CONNECTION.setAgdaMessage(error.message));
            });
        }
    }
    handleLanguageServerError(error) {
        this.core.view.set(error.name, [], 3 /* Error */);
        return this.core.view.tabs.open('settings').then(() => {
            this.core.view.store.dispatch(Action.VIEW.navigate('/Connection'));
            this.core.view.store.dispatch(Action.CONNECTION.setLanguageServerMessage(error.message));
        });
    }
    updateStore(validated) {
        this.core.view.store.dispatch(Action.CONNECTION.connectAgda(validated));
        return Promise.resolve(validated);
    }
}
exports.default = ConnectionManager;
function getAgdaPath() {
    const path = atom.config.get('agda-mode.agdaPath');
    if (path.trim() === '') {
        return Promise.reject(new Err.Conn.NoPathGiven);
    }
    else {
        return Promise.resolve(path);
    }
}
exports.getAgdaPath = getAgdaPath;
function setAgdaPath(validated) {
    atom.config.set('agda-mode.agdaPath', validated.path);
    return Promise.resolve(validated);
}
exports.setAgdaPath = setAgdaPath;
function setLanguageServerPath(validated) {
    atom.config.set('agda-mode.languageServerPath', validated.path);
    return Promise.resolve(validated);
}
exports.setLanguageServerPath = setLanguageServerPath;
function autoSearch(path) {
    if (process.platform === 'win32') {
        return Promise.reject(new Err.Conn.AutoSearchError('Unable to locate Agda on Windows systems', path));
    }
    return new Promise((resolve, reject) => {
        child_process_1.exec(`which ${path}`, (error, stdout, stderr) => {
            if (error) {
                reject(new Err.Conn.AutoSearchError(`Cannot find "${path}".\nLocating "${path}" in the user's path with 'which' but failed with the following error message: ${error.toString()}`, path));
            }
            else {
                resolve(parser_1.parseFilepath(stdout));
            }
        });
    });
}
exports.autoSearch = autoSearch;
// to make sure that we are connecting with the right thing
function validateProcess(path, validator) {
    path = parser_1.parseFilepath(path);
    return new Promise((resolve, reject) => {
        var stillHanging = true;
        if (path === '') {
            reject(new Err.Conn.Invalid(`The path must not be empty`, path));
        }
        // ask for the version and see if it's really Agda
        child_process_1.exec(`${path} --version`, (error, stdout, stderr) => {
            stillHanging = false;
            if (error) {
                // command not found
                if (error.message.toString().match(/command not found/)) {
                    reject(new Err.Conn.Invalid(`"${path}" was not found`, path));
                    // command found however the arguments are invalid
                }
                else {
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
            reject(new Err.Conn.Invalid(`Found a program named "agda" but it doesn't seem like Agda to me`, path));
        }
    });
}
exports.validateAgda = validateAgda;
function validateLanguageServer(path) {
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
        }
        else {
            reject(new Err.Conn.Invalid(`Found a program named "agda-language-server" but it doesn't seem like one to me`, path));
        }
    });
}
exports.validateLanguageServer = validateLanguageServer;
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
        // stream the incoming data to the parser
        agdaProcess.stdout.once('data', (data) => {
            resolve({
                path,
                version,
                stream: duplex(agdaProcess.stdin, agdaProcess.stdout),
                queue: [],
                filepath
            });
        });
    });
};
//# sourceMappingURL=connection.js.map
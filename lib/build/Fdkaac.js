"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FdkaacOptions_1 = require("./FdkaacOptions");
const fs_1 = require("fs");
const util_1 = require("util");
const child_process_1 = require("child_process");
const events_1 = require("events");
/**
 * Wrapper for fdkaac for Node
 *
 * @class Fdkaac
 */
class Fdkaac {
    /**
     * Creates an instance of Fdkaac and set all options
     * @param {Options} options
     */
    constructor(options) {
        this.status = {
            "started": false,
            "finished": false,
            "progress": undefined,
            "eta": undefined
        };
        this.emitter = new events_1.EventEmitter();
        this.options = options;
        this.args = new FdkaacOptions_1.FdkaacOptions(this.options).getArguments();
    }
    /**
     * Set file path of audio to encode
     *
     * @param {string} filePath
     */
    setFile(path) {
        if (!fs_1.existsSync(path)) {
            throw new Error("Audio file (path) dose not exist");
        }
        this.filePath = path;
        this.fileBuffer = undefined;
        return this;
    }
    /**
     * Set file buffer of audio to encode
     *
     * @param {Buffer} file
     *
     * @memberOf Fdkaac
     */
    setBuffer(file) {
        if (!util_1.isBuffer(file)) {
            throw new Error("Audio file (buffer) dose not exist");
        }
        this.fileBuffer = file;
        this.filePath = undefined;
        return this;
    }
    /**
     * Get encoded file path
     *
     * @returns {string} Path of encoded file
     */
    getFile() {
        if (this.encodedFilePath == undefined) {
            throw new Error("Audio is not yet encoded");
        }
        return this.encodedFilePath;
    }
    /**
     * Get encoded file as buffer
     *
     * @returns {Buffer} Encoded file
     */
    getBuffer() {
        if (this.encodedBuffer == undefined) {
            throw new Error("Audio is not yet encoded");
        }
        return this.encodedBuffer;
    }
    /**
     * Get event emitter
     *
     * @returns {EventEmitter}
     */
    getEmitter() {
        return this.emitter;
    }
    /**
     * Get status of coverter
     *
     * @returns {FdkaacStatus}
     */
    getStatus() {
        return this.status;
    }
    /**
     * Encode audio file by fdkaac/libfdk-aac
     *
     * @return {Promise}
     */
    encode() {
        if (this.filePath == undefined && this.fileBuffer == undefined) {
            throw new Error("Audio file to encode is not set");
        }
        if (this.fileBuffer != undefined) {
            this.fileBufferTempFilePath = this.tempFilePathGenerator("raw");
            return new Promise((resolve, reject) => {
                fs_1.writeFile(this.fileBufferTempFilePath, this.fileBuffer, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(this.fileBufferTempFilePath);
                });
            })
                .then((file) => {
                return this.execEncode(file);
            })
                .catch((error) => {
                this.removeTempFilesOnError();
                throw error;
            });
        }
        else {
            return this.execEncode(this.filePath)
                .catch((error) => {
                this.removeTempFilesOnError();
                throw error;
            });
        }
    }
    /**
     * Execute encoding via spawn fdkaac
     *
     * @private
     * @param {string} inputFilePath Path of input file
     */
    execEncode(inputFilePath) {
        const args = this.args;
        // Add input file to args
        args.unshift(inputFilePath);
        // Add output file to args, if not undefined in options
        if (this.options.output == "buffer") {
            const tempOutPath = this.tempFilePathGenerator("encoded");
            args.push(`-o`);
            args.push(`${tempOutPath}`);
            // Set encoded file path
            this.encodedBufferTempFilePath = tempOutPath;
        }
        else {
            // Set encoded file path
            this.encodedFilePath = this.options.output;
        }
        // Spawn instance of encoder and hook output methods
        this.status.started = true;
        this.status.finished = false;
        this.status.progress = 0;
        this.status.eta = undefined;
        /**
         * Handles output of stdout (and stderr)
         * Parse data from output into object
         *
         * @param {(String | Buffer)} data
         */
        const encoderStdout = (data) => {
            data = data.toString().trim();
            // Every output of fdkaac comes as "stderr". Deciding if it is an error or valid data by regex
            if (data.length > 10) {
                if (data.search("samples processed in") > -1) {
                    this.status.finished = true;
                    this.status.progress = 100;
                    this.status.eta = "00:00";
                    this.emitter.emit("finish");
                    this.emitter.emit("progress", [this.status.progress, this.status.eta]);
                }
                else if (data.search(/^\[(1{0,1}[0-9]{1,2})%\] /) > -1) {
                    const progressMatch = data.match(/^\[(1{0,1}[0-9]{1,2})%\] /);
                    const etaMatch = data.match(/ETA ([0-9][0-9]:[0-9][0-9])/);
                    const progress = String(progressMatch[1]);
                    let eta = null;
                    if (etaMatch != null) {
                        eta = etaMatch[1];
                    }
                    if (progress != null && Number(progress) > this.status.progress) {
                        this.status.progress = Number(progress);
                    }
                    if (eta != null) {
                        this.status.eta = eta;
                    }
                    this.emitter.emit("progress", [this.status.progress, this.status.eta]);
                }
                else if (data.search(/ETA ([0-9][0-9]:[0-9][0-9])/) > -1) {
                    const etaMatch = data.match(/ETA ([0-9][0-9]:[0-9][0-9])/);
                    const eta = etaMatch[1];
                    if (eta != null) {
                        this.status.eta = eta;
                    }
                }
                else if (data.search(/\(([0-9][0-9]|[0-9])x\)/) > -1 || data.search(/^[0-9]{1,2}:[0-9]{1,2}.[0-9]{1,3}\/[0-9]{1,2}:[0-9]{1,2}.[0-9]{1,3}/) > -1) {
                    // linebreak of status, unknown in next line => do nothing
                }
                else {
                    if (data.search(/^fdkaac/) == -1) {
                        data = `fdkaac: ${data}`;
                    }
                    this.emitter.emit("error", String(data));
                }
            }
        };
        /**
         * Handles error throw of fdkaac instance
         *
         * @param {Error} error
         */
        const encoderError = (error) => {
            this.emitter.emit("error", error);
        };
        const instance = child_process_1.spawn("fdkaac", args);
        instance.stdout.on("data", encoderStdout);
        instance.stderr.on("data", encoderStdout); // Most output, even non-errors, is on stderr
        instance.on("error", encoderError);
        // Return promise of finish encoding progress
        return new Promise((resolve, reject) => {
            this.emitter.on("finish", () => {
                // If input was buffer, remove temp file
                if (this.fileBufferTempFilePath != undefined) {
                    fs_1.unlink(this.fileBufferTempFilePath);
                }
                // If output should be a buffer, load encoded audio file into object and remove temp file
                if (this.options.output == "buffer") {
                    fs_1.readFile(this.encodedBufferTempFilePath, null, (error, data) => {
                        // Remove temp encoded file
                        fs_1.unlink(this.encodedBufferTempFilePath);
                        if (error) {
                            reject(error);
                            return;
                        }
                        this.encodedBuffer = new Buffer(data);
                        this.encodedBufferTempFilePath = undefined;
                        resolve(this);
                    });
                }
                else {
                    resolve(this);
                }
            });
            this.emitter.on("error", (error) => {
                reject(error);
            });
        });
    }
    /**
     * Generate temp file path
     *
     * @param {("raw" | "encoded")} type
     * @returns {string} Path
     */
    tempFilePathGenerator(type) {
        const prefix = `${__dirname}/../.`;
        let path = `${prefix}./temp/${type}/`;
        let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            path += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        if (!fs_1.existsSync(`${prefix}./temp/${path}`)) {
            return path;
        }
        else {
            return this.tempFilePathGenerator(type);
        }
    }
    /**
     * Remove temp files, if error occurred
     */
    removeTempFilesOnError() {
        if (this.fileBufferTempFilePath != undefined) {
            fs_1.unlink(this.fileBufferTempFilePath);
        }
        if (this.encodedBufferTempFilePath != undefined) {
            fs_1.unlink(this.encodedBufferTempFilePath);
        }
    }
}
exports.Fdkaac = Fdkaac;
//# sourceMappingURL=Fdkaac.js.map
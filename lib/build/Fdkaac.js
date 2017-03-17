"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FdkaacOptions_1 = require("./FdkaacOptions");
var fs_1 = require("fs");
var util_1 = require("util");
var child_process_1 = require("child_process");
var events_1 = require("events");
/**
 * Wrapper for fdkaac for Node
 *
 * @class Fdkaac
 */
var Fdkaac = (function () {
    /**
     * Creates an instance of Fdkaac and set all options
     * @param {Options} options
     */
    function Fdkaac(options) {
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
    Fdkaac.prototype.setFile = function (path) {
        if (!fs_1.existsSync(path)) {
            throw new Error("Audio file (path) dose not exist");
        }
        this.filePath = path;
        this.fileBuffer = undefined;
        return this;
    };
    /**
     * Set file buffer of audio to encode
     *
     * @param {Buffer} file
     *
     * @memberOf Fdkaac
     */
    Fdkaac.prototype.setBuffer = function (file) {
        if (!util_1.isBuffer(file)) {
            throw new Error("Audio file (buffer) dose not exist");
        }
        this.fileBuffer = file;
        this.filePath = undefined;
        return this;
    };
    /**
     * Get encoded file path
     *
     * @returns {string} Path of encoded file
     */
    Fdkaac.prototype.getFile = function () {
        if (this.encodedFilePath == undefined) {
            throw new Error("Audio is not yet encoded");
        }
        return this.encodedFilePath;
    };
    /**
     * Get encoded file as buffer
     *
     * @returns {Buffer} Encoded file
     */
    Fdkaac.prototype.getBuffer = function () {
        if (this.encodedBuffer == undefined) {
            throw new Error("Audio is not yet encoded");
        }
        return this.encodedBuffer;
    };
    /**
     * Get event emitter
     *
     * @returns {EventEmitter}
     */
    Fdkaac.prototype.getEmitter = function () {
        return this.emitter;
    };
    /**
     * Get status of coverter
     *
     * @returns {FdkaacStatus}
     */
    Fdkaac.prototype.getStatus = function () {
        return this.status;
    };
    /**
     * Encode audio file by fdkaac/libfdk-aac
     *
     * @return {boolean} Encoding have started
     */
    Fdkaac.prototype.encode = function () {
        var _this = this;
        if (this.filePath == undefined && this.fileBuffer == undefined) {
            throw new Error("Audio file to encode is not set");
        }
        if (this.fileBuffer != undefined) {
            this.fileBufferTempFilePath = this.tempFilePathGenerator("raw");
            return new Promise(function (resolve, reject) {
                fs_1.writeFile(_this.fileBufferTempFilePath, _this.fileBuffer, function (err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(_this.fileBufferTempFilePath);
                });
            })
                .then(function (file) {
                return _this.execEncode(file);
            })
                .catch(function (error) {
                _this.removeTempFilesOnError();
                throw error;
            });
        }
        else {
            return this.execEncode(this.filePath)
                .catch(function (error) {
                _this.removeTempFilesOnError();
                throw error;
            });
        }
    };
    /**
     * Execute encoding via spawn fdkaac
     *
     * @private
     * @param {string} inputFilePath Path of input file
     */
    Fdkaac.prototype.execEncode = function (inputFilePath) {
        var _this = this;
        // Add input file to args
        this.args.unshift(inputFilePath);
        // Add output file to args, if not in options undefined
        if (this.options.output == "buffer") {
            var tempOutPath = this.tempFilePathGenerator("encoded");
            this.args.push("-o");
            this.args.push("" + tempOutPath);
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
        var encoderStdout = function (data) {
            data = data.toString().trim();
            // Every output of fdkaac comes as "stderr", so decide if it is an error or valid data by regex
            if (data.length > 10) {
                if (data.search("samples processed in") > -1) {
                    _this.status.finished = true;
                    _this.status.progress = 100;
                    _this.status.eta = "00:00";
                    _this.emitter.emit("finish");
                    _this.emitter.emit("progress", [_this.status.progress, _this.status.eta]);
                }
                else if (data.search(/^\[(1{0,1}[0-9]{1,2})%\] /) > -1) {
                    var progressMatch = data.match(/^\[(1{0,1}[0-9]{1,2})%\] /);
                    var etaMatch = data.match(/ETA ([0-9][0-9]:[0-9][0-9])/);
                    var progress = String(progressMatch[1]);
                    var eta = null;
                    if (etaMatch != null) {
                        eta = etaMatch[1];
                    }
                    if (progress != null && Number(progress) > _this.status.progress) {
                        _this.status.progress = Number(progress);
                    }
                    if (eta != null) {
                        _this.status.eta = eta;
                    }
                    _this.emitter.emit("progress", [_this.status.progress, _this.status.eta]);
                }
                else if (data.search(/ETA ([0-9][0-9]:[0-9][0-9])/) > -1) {
                    var etaMatch = data.match(/ETA ([0-9][0-9]:[0-9][0-9])/);
                    var eta = etaMatch[1];
                    if (eta != null) {
                        _this.status.eta = eta;
                    }
                }
                else if (data.search(/\(([0-9][0-9]|[0-9])x\)/) > -1) {
                }
                else {
                    if (data.search(/^fdkaac/) == -1) {
                        data = "fdkaac: " + data;
                    }
                    _this.emitter.emit("error", String(data));
                }
            }
        };
        /**
         * Handles error throw of fdkaac instance
         *
         * @param {Error} error
         */
        var encoderError = function (error) {
            _this.emitter.emit("error", error);
        };
        var instance = child_process_1.spawn("fdkaac", this.args);
        instance.stdout.on("data", encoderStdout);
        instance.stderr.on("data", encoderStdout); // Most output, even not errors, are on stderr
        instance.on("error", encoderError);
        // Return promise of finish encoding progress
        return new Promise(function (resolve, reject) {
            _this.emitter.on("finish", function () {
                // If input was buffer, remove temp file
                if (_this.fileBufferTempFilePath != undefined) {
                    fs_1.unlink(_this.fileBufferTempFilePath);
                }
                // If output should be a buffer, load encoded audio file in object and remove temp file
                if (_this.options.output == "buffer") {
                    fs_1.readFile(_this.encodedBufferTempFilePath, null, function (error, data) {
                        // Remove temp encoded file
                        fs_1.unlink(_this.encodedBufferTempFilePath);
                        if (error) {
                            reject(error);
                            return;
                        }
                        _this.encodedBuffer = new Buffer(data);
                        _this.encodedBufferTempFilePath = undefined;
                    });
                }
                else {
                    resolve(_this);
                }
            });
            _this.emitter.on("error", function (error) {
                reject(error);
            });
        });
    };
    /**
     * Generate temp file path
     *
     * @param {("raw" | "encoded")} type
     * @returns {string} Path
     */
    Fdkaac.prototype.tempFilePathGenerator = function (type) {
        var path = "./temp/" + type + "/";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 32; i++) {
            path += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        if (!fs_1.existsSync("./temp/" + path)) {
            return path;
        }
        else {
            return this.tempFilePathGenerator(type);
        }
    };
    /**
     * Remove temp files, if error occurred
     */
    Fdkaac.prototype.removeTempFilesOnError = function () {
        if (this.fileBufferTempFilePath != undefined) {
            fs_1.unlink(this.fileBufferTempFilePath);
        }
        if (this.encodedBufferTempFilePath != undefined) {
            fs_1.unlink(this.encodedBufferTempFilePath);
        }
    };
    return Fdkaac;
}());
exports.Fdkaac = Fdkaac;
//# sourceMappingURL=Fdkaac.js.map
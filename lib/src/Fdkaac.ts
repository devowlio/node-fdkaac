import { FdkaacStatus, Options } from "./FdkaacTypings";
import { FdkaacOptions } from "./FdkaacOptions";
import {
    existsSync as fsExistsSync,
    readFile as fsReadFile,
    writeFile as fsWriteFile,
    unlinkSync as fsUnlinkSync
} from "fs";
import { spawn } from "child_process";
import { EventEmitter } from "events";

/**
 * Wrapper for fdkaac for Node
 *
 * @class Fdkaac
 */
class Fdkaac {
    private status: FdkaacStatus = {
        started: false,
        finished: false,
        progress: undefined,
        eta: undefined
    };
    private emitter: EventEmitter = new EventEmitter();

    private options: Options;
    private args: string[];

    private filePath: string;
    private fileBuffer: Buffer;
    private fileBufferTempFilePath: string;

    private progressedFilePath: string;
    private progressedBuffer: Buffer;
    private progressedBufferTempFilePath: string;

    /**
     * Creates an instance of Fdkaac and set all options
     * @param {Options} options
     */
    constructor(options: Options) {
        this.options = options;
        this.args = new FdkaacOptions(this.options).getArguments();
    }

    /**
     * Set file path of audio to encode
     *
     * @param {string} filePath
     */
    public setFile(path: string): Fdkaac {
        if (!fsExistsSync(path)) {
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
    public setBuffer(file: Buffer): Fdkaac {
        if (!Buffer.isBuffer(file)) {
            throw new Error("Audio file (buffer) dose not exist");
        }

        this.fileBuffer = file;
        this.filePath = undefined;

        return this;
    }

    /**
     * Get encoded file path
     *
     * @returns {string} Path of encoded/decoded file
     */
    public getFile(): string {
        if (this.progressedFilePath == undefined) {
            throw new Error("Audio is not yet encoded");
        }

        return this.progressedFilePath;
    }

    /**
     * Get encoded file as buffer
     *
     * @returns {Buffer} Encoded/Decoded file
     */
    public getBuffer(): Buffer {
        if (this.progressedBuffer == undefined) {
            throw new Error("Audio is not yet encoded");
        }

        return this.progressedBuffer;
    }

    /**
     * Get event emitter
     *
     * @returns {EventEmitter}
     */
    public getEmitter(): EventEmitter {
        return this.emitter;
    }

    /**
     * Get status of converter
     *
     * @returns {FdkaacStatus}
     */
    public getStatus(): FdkaacStatus {
        return this.status;
    }

    /**
     * Encode audio file by fdkaac/libfdk-aac
     *
     * @return {Promise}
     */
    public encode(): Promise<any> {
        return this.progress("encode");
    }

    /**
     * Decode audio file by ffmpeg
     *
     * @return {Promise}
     */
    public decode(): Promise<boolean> {
        return this.progress("decode");
    }

    /**
     * Decode/Encode audio file
     *
     * @return {Promise}
     */
    private progress(type: "encode" | "decode"): Promise<any> {
        if (this.filePath == undefined && this.fileBuffer == undefined) {
            throw new Error("Audio file to encode is not set");
        }

        if (this.fileBuffer != undefined) {
            // File buffer is set; write it as temp file
            this.fileBufferTempFilePath = this.tempFilePathGenerator(
                "raw",
                type
            );

            return new Promise((resolve, reject) => {
                fsWriteFile(
                    this.fileBufferTempFilePath,
                    this.fileBuffer,
                    err => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        resolve(this.fileBufferTempFilePath);
                    }
                );
            })
                .then((file: string) => {
                    if (type == "encode") {
                        return this.execEncode(file);
                    } else if (type == "decode") {
                        return this.execDecode(file);
                    } else {
                        throw new Error(
                            "node-ffcaac can only 'encode' and 'decode'."
                        );
                    }
                })
                .catch((error: Error) => {
                    this.removeTempFilesOnError();
                    throw error;
                });
        } else {
            // File path is set
            if (type == "encode") {
                return this.execEncode(this.filePath).catch((error: Error) => {
                    this.removeTempFilesOnError();
                    throw error;
                });
            } else if (type == "decode") {
                return this.execDecode(this.filePath).catch((error: Error) => {
                    this.removeTempFilesOnError();
                    throw error;
                });
            } else {
                throw new Error("node-ffcaac can only 'encode' and 'decode'.");
            }
        }
    }

    /**
     * Execute encoding via spawn fdkaac
     *
     * @private
     * @param {string} inputFilePath Path of input file
     */
    private execEncode(inputFilePath: string) {
        const args = this.args;

        // Add input file to args
        args.unshift(inputFilePath);

        // Add output file to args, if not undefined in options
        if (this.options.output == "buffer") {
            const tempOutPath = this.tempFilePathGenerator("encoded", "encode");
            args.push(`-o`);
            args.push(`${tempOutPath}`);

            // Set encoded file path
            this.progressedBufferTempFilePath = tempOutPath;
        } else {
            // Set encoded file path
            this.progressedFilePath = this.options.output;
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
        const encoderStdout = (data: String | Buffer) => {
            data = data.toString().trim();

            // Every output of fdkaac comes as "stderr". Deciding if it is an error or valid data by regex
            if (data.length > 10) {
                if (data.search("samples processed in") > -1) {
                    // processing done
                    this.status.finished = true;
                    this.status.progress = 100;
                    this.status.eta = "00:00";

                    this.emitter.emit("finish");
                    this.emitter.emit("progress", [
                        this.status.progress,
                        this.status.eta
                    ]);
                } else if (data.search(/^\[(1{0,1}[0-9]{1,2})%\] /) > -1) {
                    // status of processing
                    const progressMatch = data.match(
                        /^\[(1{0,1}[0-9]{1,2})%\] /
                    );
                    const etaMatch = data.match(/ETA ([0-9][0-9]:[0-9][0-9])/);

                    const progress: string = String(progressMatch[1]);
                    let eta: string = null;
                    if (etaMatch != null) {
                        eta = etaMatch[1];
                    }

                    if (
                        progress != null &&
                        Number(progress) > this.status.progress
                    ) {
                        this.status.progress = Number(progress);
                    }

                    if (eta != null) {
                        this.status.eta = eta;
                    }

                    this.emitter.emit("progress", [
                        this.status.progress,
                        this.status.eta
                    ]);
                } else if (data.search(/ETA ([0-9][0-9]:[0-9][0-9])/) > -1) {
                    // line break of status, eta in next line
                    const etaMatch = data.match(/ETA ([0-9][0-9]:[0-9][0-9])/);
                    const eta = etaMatch[1];

                    if (eta != null) {
                        this.status.eta = eta;
                    }
                } else if (
                    data.search(/\(([0-9][0-9]|[0-9])x\)/) > -1 ||
                    data.search(
                        /^[0-9]{1,2}:[0-9]{1,2}.[0-9]{1,3}\/[0-9]{1,2}:[0-9]{1,2}.[0-9]{1,3}/
                    ) > -1
                ) {
                    // line break of status, unknown in next line => do nothing
                } else {
                    // Unexpected output => error
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
        const encoderError = (error: Error) => {
            this.emitter.emit("error", error);
        };

        const instance = spawn("fdkaac", args);
        instance.stdout.on("data", encoderStdout);
        instance.stderr.on("data", encoderStdout); // Most output, even non-errors, is on stderr
        instance.on("error", encoderError);

        // Return promise of finish encoding progress
        return new Promise((resolve, reject) => {
            this.emitter.on("finish", () => {
                // If input was buffer, remove temp file
                if (this.fileBufferTempFilePath != undefined) {
                    fsUnlinkSync(this.fileBufferTempFilePath);
                }

                // If output should be a buffer, load encoded audio file into object and remove temp file
                if (this.options.output == "buffer") {
                    fsReadFile(
                        this.progressedBufferTempFilePath,
                        null,
                        (error, data: string) => {
                            // Remove temp encoded file
                            fsUnlinkSync(this.progressedBufferTempFilePath);

                            if (error) {
                                reject(error);
                                return;
                            }

                            this.progressedBuffer = Buffer.from(data);
                            this.progressedBufferTempFilePath = undefined;

                            resolve(this);
                        }
                    );
                } else {
                    resolve(this);
                }
            });

            this.emitter.on("error", error => {
                reject(error);
            });
        });
    }

    /**
     * Execute decoding via spawn ffmpeg
     *
     * @private
     * @param {string} inputFilePath Path of input file
     */
    private execDecode(inputFilePath: string) {
        const args: string[] = [];
        args.push("-loglevel");
        args.push("error");
        args.push("-stats");
        args.push("-i");

        // Add input file to args
        args.push(inputFilePath);

        // Add output file to args, if not undefined in options
        if (this.options.output == "buffer") {
            const tempOutPath = `${this.tempFilePathGenerator(
                "encoded",
                "decode"
            )}.wav`;
            args.push(`${tempOutPath}`);

            // Set decode/encoded file path
            this.progressedBufferTempFilePath = tempOutPath;
        } else {
            // Set decode/encoded file path
            this.progressedFilePath = this.options.output;
            args.push(this.progressedFilePath);
        }

        // Exec ffmpeg to get duration of audio
        let duration: number = null;

        const argsDuration: string[] = [];
        argsDuration.push("-i");
        argsDuration.push(inputFilePath);

        const instanceDuration = spawn("ffmpeg", argsDuration);

        const durationStdout = (data: String | Buffer) => {
            if (duration) {
                return;
            }

            data = data.toString().trim();

            const match = data.match(
                /Duration\: [0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2}.[0-9]{1,2}/
            );

            if (match && match[0]) {
                const durationString = String(match[0])
                    .replace("Duration:", "")
                    .trim();
                const durationArray = durationString.split(":");
                duration =
                    Number(durationArray[0]) * 60 * 60 +
                    Number(durationArray[1]) * 60 +
                    Number(String(durationArray[2]).split(".")[0]);
            }
        };

        const durationError = (error: Error) => {
            this.emitter.emit("error", error);
        };

        instanceDuration.stdout.on("data", durationStdout);
        instanceDuration.stderr.on("data", durationStdout); // Most output, even non-errors, is on stderr
        instanceDuration.on("error", durationError);

        // Spawn instance of decoder and hook output methods
        this.status.started = true;
        this.status.finished = false;
        this.status.progress = 0;
        this.status.eta = undefined;
        const decodeStartTime = new Date().getTime();

        /**
         * Handles output of stdout (and stderr)
         * Parse data from output into object
         *
         * @param {(String | Buffer)} data
         */
        const decoderStdout = (data: String | Buffer) => {
            data = data.toString().trim();

            // Every output of ffmpeg comes as "stderr". Decoding if it is an error or valid data by regex
            if (data.search(/^size\=/) > -1) {
                // status of processing
                if (!duration) {
                    // Duration as reference point for calculation of progress required
                    return;
                }
                const decodeTime = new Date().getTime() - decodeStartTime;
                const match = data.match(/speed\= [0-9]{1,3}/);

                if (match && match[0]) {
                    const speedFactor = Number(
                        String(match[0])
                            .replace("speed=", "")
                            .trim()
                    );
                    let progress =
                        Math.round(
                            (((decodeTime / 1000) * speedFactor) /
                                (duration / 100)) *
                                100
                        ) / 100;
                    progress = progress > 100 ? 100 : progress;

                    const eta = Math.ceil(
                        ((100 - progress) * (decodeTime / progress)) / 1000
                    );
                    const etaString = `${(
                        "0" + String(Math.floor(eta / 60))
                    ).slice(-2)}:${("0" + String(eta % 60)).slice(-2)}`;

                    this.status.progress = progress;
                    this.status.eta = etaString;

                    this.emitter.emit("progress", [
                        this.status.progress,
                        this.status.eta
                    ]);
                }
            } else {
                // Unexpected output => error
                data = `fdkaac: ${data}`;

                this.emitter.emit("error", String(data));
            }
        };

        /**
         * Handles error throw of ffmpeg instance
         *
         * @param {Error} error
         */
        const decoderError = (error: Error) => {
            this.emitter.emit("error", error);
        };

        const decoderExit = (code: number) => {
            if (code == 0) {
                // Finished
                this.status.finished = true;
                this.status.progress = 100;
                this.status.eta = "00:00";

                this.emitter.emit("finish");
                this.emitter.emit("progress", [
                    this.status.progress,
                    this.status.eta
                ]);
            } else {
                this.emitter.emit(
                    "error",
                    `fdkaac: unknown error while decoding`
                );
            }
        };

        const instance = spawn("ffmpeg", args);
        instance.stdout.on("data", decoderStdout);
        instance.stderr.on("data", decoderStdout); // Most output, even non-errors, is on stderr
        instance.on("error", decoderError);
        instance.on("exit", decoderExit);

        // Return promise of finish encoding progress
        return new Promise((resolve, reject) => {
            this.emitter.on("finish", () => {
                // If input was buffer, remove temp file
                if (this.fileBufferTempFilePath != undefined) {
                    fsUnlinkSync(this.fileBufferTempFilePath);
                }

                // If output should be a buffer, load encoded audio file into object and remove temp file
                if (this.options.output == "buffer") {
                    fsReadFile(
                        this.progressedBufferTempFilePath,
                        null,
                        (error, data: string) => {
                            // Remove temp encoded file
                            fsUnlinkSync(this.progressedBufferTempFilePath);

                            if (error) {
                                reject(error);
                                return;
                            }

                            this.progressedBuffer = Buffer.from(data);
                            this.progressedBufferTempFilePath = undefined;

                            resolve(this);
                        }
                    );
                } else {
                    resolve(this);
                }
            });

            this.emitter.on("error", error => {
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
    private tempFilePathGenerator(
        type: "raw" | "encoded",
        progressType: "encode" | "decode"
    ): string {
        const prefix = `${__dirname}/../.`;
        let path = `${prefix}./temp/${type}/`;
        let possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (let i = 0; i < 32; i++) {
            path += possible.charAt(
                Math.floor(Math.random() * possible.length)
            );
        }

        if (type == "raw" && progressType == "decode") {
            path += `.mp3`;
        }

        if (!fsExistsSync(`${prefix}./temp/${path}`)) {
            return path;
        } else {
            return this.tempFilePathGenerator(type, progressType);
        }
    }

    /**
     * Remove temp files, if error occurred
     */
    private removeTempFilesOnError() {
        if (this.fileBufferTempFilePath != undefined && fsExistsSync(this.fileBufferTempFilePath)) {
            fsUnlinkSync(this.fileBufferTempFilePath);
        }

        if (this.progressedBufferTempFilePath != undefined && fsExistsSync(this.progressedBufferTempFilePath)) {
            fsUnlinkSync(this.progressedBufferTempFilePath);
        }
    }
}

export { Fdkaac };

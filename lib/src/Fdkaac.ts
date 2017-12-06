import { FdkaacStatus, Options } from "./FdkaacTypings";
import { FdkaacOptions } from "./FdkaacOptions";
import { existsSync as fsExistsSync, readFile as fsReadFile, writeFile as fsWriteFile, writeFileSync as fsWriteFileSync, unlink as fsUnlink } from "fs";
import { isBuffer as utilIsBuffer } from "util";
import { spawn } from "child_process";
import { EventEmitter } from "events";

/**
 * Wrapper for fdkaac for Node 
 * 
 * @class Fdkaac
 */
class Fdkaac {
	private status: FdkaacStatus = {
		"started": false,
		"finished": false,
		"progress": undefined,
		"eta": undefined
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
		if (!utilIsBuffer(file)) {
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
	 * Get status of coverter
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
		if (this.filePath == undefined && this.fileBuffer == undefined) {
			throw new Error("Audio file to encode is not set");
		}

		if (this.fileBuffer != undefined) { // File buffer is set; write it as temp file
			this.fileBufferTempFilePath = this.tempFilePathGenerator("raw", "encode");

			return new Promise((resolve, reject) => {
				fsWriteFile(this.fileBufferTempFilePath, this.fileBuffer, (err) => {
					if (err) {
						reject(err);
						return;
					}

					resolve(this.fileBufferTempFilePath);
				});
			})
				.then((file: string) => {
					return this.execEncode(file);
				})
				.catch((error: Error) => {
					this.removeTempFilesOnError();
					throw error;
				});
		}
		else { // File path is set
			return this.execEncode(this.filePath)
				.catch((error: Error) => {
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
		}
		else {
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
				if (data.search("samples processed in") > -1) { // processing done
					this.status.finished = true;
					this.status.progress = 100;
					this.status.eta = "00:00";

					this.emitter.emit("finish");
					this.emitter.emit("progress", [this.status.progress, this.status.eta]);
				}
				else if (data.search(/^\[(1{0,1}[0-9]{1,2})%\] /) > -1) { // status of processing
					const progressMatch = data.match(/^\[(1{0,1}[0-9]{1,2})%\] /);
					const etaMatch = data.match(/ETA ([0-9][0-9]:[0-9][0-9])/);

					const progress: string = String(progressMatch[1]);
					let eta: string = null;
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
				else if (data.search(/ETA ([0-9][0-9]:[0-9][0-9])/) > -1) { // linebreak of status, eta in next line
					const etaMatch = data.match(/ETA ([0-9][0-9]:[0-9][0-9])/);
					const eta = etaMatch[1];

					if (eta != null) {
						this.status.eta = eta;
					}
				}
				else if (data.search(/\(([0-9][0-9]|[0-9])x\)/) > -1 || data.search(/^[0-9]{1,2}:[0-9]{1,2}.[0-9]{1,3}\/[0-9]{1,2}:[0-9]{1,2}.[0-9]{1,3}/) > -1) {
					// linebreak of status, unknown in next line => do nothing
				}
				else { // Unexpected output => error
					if (data.search(/^fdkaac/) == -1) {
						data = `fdkaac: ${data}`;
					}

					this.emitter.emit("error", String(data));
				}
			}
		}

		/**
		 * Handles error throw of fdkaac instance
		 * 
		 * @param {Error} error
		 */
		const encoderError = (error: Error) => {
			this.emitter.emit("error", error);
		}

		const instance = spawn("fdkaac", args);
		instance.stdout.on("data", encoderStdout);
		instance.stderr.on("data", encoderStdout); // Most output, even non-errors, is on stderr
		instance.on("error", encoderError);

		// Return promise of finish encoding progress
		return new Promise((resolve, reject) => {
			this.emitter.on("finish", () => {
				// If input was buffer, remove temp file
				if (this.fileBufferTempFilePath != undefined) {
					fsUnlink(this.fileBufferTempFilePath);
				}

				// If output should be a buffer, load encoded audio file into object and remove temp file
				if (this.options.output == "buffer") {
					fsReadFile(this.progressedBufferTempFilePath, null, (error, data: string) => {
						// Remove temp encoded file
						fsUnlink(this.progressedBufferTempFilePath);

						if (error) {
							reject(error);
							return;
						}

						this.progressedBuffer = new Buffer(data);
						this.progressedBufferTempFilePath = undefined;

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
	private tempFilePathGenerator(type: "raw" | "encoded", progressType: "encode" | "decode"): string {
		const prefix = `${__dirname}/../.`;
		let path = `${prefix}./temp/${type}/`;
		let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for (let i = 0; i < 32; i++) {
			path += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		if (type == "raw" && progressType == "decode") {
			path += `.mp3`;
		}

		if (!fsExistsSync(`${prefix}./temp/${path}`)) {
			return path;
		}
		else {
			return this.tempFilePathGenerator(type, progressType);
		}
	}

	/**
	 * Remove temp files, if error occurred
	 */
	private removeTempFilesOnError() {
		if (this.fileBufferTempFilePath != undefined) {
			try {
				fsUnlink(this.fileBufferTempFilePath);
			}
			catch (error) {
				// Ignore
			}
		}

		if (this.progressedBufferTempFilePath != undefined) {
			try {
				fsUnlink(this.progressedBufferTempFilePath);
			}
			catch (error) {
				// Ignore; actually already unlinked
			}
		}
	}
}

export { Fdkaac };
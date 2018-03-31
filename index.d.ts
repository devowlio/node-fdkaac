// Type definitions for node-fdkaac v1.2.0
// Project: https://github.com/jankarres/node-fdkaac
// Definitions by: Jan Karres <https://github.com/jankarres/>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

import { EventEmitter } from "events";

declare namespace Options {
	type profile = 2 | 5 | 29 | 23 | 39;
	type bitrateMode = 0 | 1 | 2 | 3 | 4 | 5;
	type lowdelaySbr = -1 | 0 | 1;
	type sbrRatio = 0 | 1 | 2;
	type transportFormat = 0 | 1 | 2 | 6 | 7 | 10;
	type gaplessMode = 0 | 1 | 2;

	interface meta {
		"title"?: string;
		"artist"?: string;
		"album"?: string;
		"genre"?: string;
		"date"?: string;
		"composer"?: string;
		"grouping"?: string;
		"comment"?: string;
		"album-artist"?: string;
		"disk"?: string;
		"tempo"?: number;
		"tag"?: string;
		"tag-from-file"?: string;
		"long-tag"?: string;
	}
}

declare interface Options {
	"output": string | "buffer";
	"profile"?: Options.profile;
	"bitrate"?: number;
	"bitrate-mode"?: Options.bitrateMode;
	"bandwidth"?: number;
	"afterburner"?: boolean;
	"lowdelay-sbr"?: Options.lowdelaySbr;
	"sbr-ratio"?: Options.sbrRatio;
	"transport-format"?: Options.transportFormat;
	"adts-crc-check"?: boolean;
	"header-period"?: string;
	"gapless-mode"?: Options.gaplessMode;
	"include-sbr-delay"?: boolean;
	"ignorelength"?: boolean;
	"moov-before-mdat"?: boolean;
	"raw"?: boolean;
	"raw-channels"?: number;
	"raw-rate"?: number;
	"raw-format"?: string;
	"meta"?: Options.meta;
}

declare interface FdkaacStatus {
	"started": boolean;
	"finished": boolean;
	"progress": number;
	"eta": string;
}

declare class Fdkaac {
	constructor(options: Options);

	public setFile(path: string): Fdkaac;
	public setBuffer(file: Buffer): Fdkaac;
	public getFile(): string;
	public getBuffer(): Buffer;
	public getEmitter(): EventEmitter;
	public getStatus(): FdkaacStatus;

	public encode(): Promise<boolean>;
	public decode(): Promise<boolean>;
	private execEncode(inputFilePath: string);
	private tempFilePathGenerator(type: "raw" | "encoded"): string;
}

export { Fdkaac };

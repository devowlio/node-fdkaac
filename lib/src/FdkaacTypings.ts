/**
 * Status data of fdkaac instance
 *
 * @interface FdkaacStatus
 */
interface FdkaacStatus {
    started: boolean;
    finished: boolean;
    progress: number;
    eta: string;
}

/**
 * Raw options interface and types for Typescript definitions
 */
namespace Options {
    export type profile = 2 | 5 | 29 | 23 | 39;
    export type bitrateMode = 0 | 1 | 2 | 3 | 4 | 5;
    export type lowdelaySbr = -1 | 0 | 1;
    export type sbrRatio = 0 | 1 | 2;
    export type transportFormat = 0 | 1 | 2 | 6 | 7 | 10;
    export type gaplessMode = 0 | 1 | 2;

    export interface meta {
        title?: string;
        artist?: string;
        album?: string;
        genre?: string;
        date?: string;
        composer?: string;
        grouping?: string;
        comment?: string;
        "album-artist"?: string;
        disk?: string;
        tempo?: number;
        tag?: string;
        "tag-from-file"?: string;
        "long-tag"?: string;
    }
}

interface Options {
    output: string | "buffer";
    profile?: Options.profile;
    bitrate?: number;
    "bitrate-mode"?: Options.bitrateMode;
    bandwidth?: number;
    afterburner?: boolean;
    "lowdelay-sbr"?: Options.lowdelaySbr;
    "sbr-ratio"?: Options.sbrRatio;
    "transport-format"?: Options.transportFormat;
    "adts-crc-check"?: boolean;
    "header-period"?: number;
    "gapless-mode"?: Options.gaplessMode;
    "include-sbr-delay"?: boolean;
    ignorelength?: boolean;
    "moov-before-mdat"?: boolean;
    raw?: boolean;
    "raw-channels"?: number;
    "raw-rate"?: number;
    "raw-format"?: string;
    meta?: Options.meta;
}

export { FdkaacStatus, Options };

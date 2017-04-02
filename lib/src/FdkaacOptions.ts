import { Options } from "./FdkaacTypings";
import * as fs from "fs";

/**
 * All options of node-fdkaac; build argument array for binary
 * 
 * @class FdkaacOptions
 */
class FdkaacOptions {
    private args = [];
    /**
     * Validate all options and build argument array for binary
     * @param {Object} options
     */
    constructor(options: Options) {
        // Output is required
        if (options["output"] == undefined) {
            throw new Error("fdkaac: Invalid option: 'output' is required");
        }

        // Save options as arguments
        for (const key in options) {
            const value = options[key];
            let arg;

            switch (key) {
                case "output":
                    arg = this.output(value);
                    break;
                case "profile":
                    arg = this.profile(value);
                    break;
                case "bitrate":
                    arg = this.bitrate(value);
                    break;
                case "bitrate-mode":
                    arg = this.bitrateMode(value);
                    break;
                case "bandwidth":
                    arg = this.bandwidth(value);
                    break;
                case "afterburner":
                    arg = this.afterburner(value);
                    break;
                case "lowdelay-sbr":
                    arg = this.lowdelaySbr(value);
                    break;
                case "sbr-ratio":
                    arg = this.sbrRatio(value);
                    break;
                case "transport-format":
                    arg = this.transportFormat(value);
                    break;
                case "adts-crc-check":
                    arg = this.adtsCrcCheck(value);
                    break;
                case "header-period":
                    arg = this.headerPeriod(value);
                    break;
                case "gapless-mode":
                    arg = this.gaplessMode(value);
                    break;
                case "include-sbr-delay":
                    arg = this.includeSbrDelay(value);
                    break;
                case "ignorelength":
                    arg = this.ignorelength(value);
                    break;
                case "moov-before-mdat":
                    arg = this.moovBeforeMdat(value);
                    break;
                case "raw":
                    arg = this.raw(value);
                    break;
                case "raw-channels":
                    arg = this.rawChannels(value);
                    break;
                case "raw-rate":
                    arg = this.rawRate(value);
                    break;
                case "raw-format":
                    arg = this.rawFormat(value);
                    break;
                case "meta":
                    arg = this.meta(value);
                    break;
                default:
                    throw new Error("Unknown parameter " + key);
            }

            if (arg != undefined) {
                for (const i in arg) {
                    this.args.push(arg[i]);
                }
            }
        }
    }

    /**
     * Get all arguments for binary
     */
    public getArguments() {
        return this.args;
    }

    private output(value) {
        if (value != "buffer") {
            return [`-o`, `${value}`];
        }
    }

    private profile(value) {
        if (value != 2 && value != 5 && value != 29 && value != 23 && value != 39) {
            throw new Error("fdkaac: Invalid option: 'profile' have to be 2, 5, 29, 23 or 39");
        }

        return [`--profile`, value];
    }

    private bitrate(value) {
        if (value < 1) {
            throw new Error("fdkaac: Invalid option: 'birate' have to be positive");
        }

        return [`--bitrate`, value];
    }

    private bitrateMode(value) {
        if (value < 0 || value > 5) {
            throw new Error("Invalid option: 'bitrateMode' have to be betweet 0 and 5");
        }

        return [`--bitrate-mode`, value];
    }

    private bandwidth(value) {
        if (value < 1) {
            throw new Error("fdkaac: Invalid option: 'bandwidth' have to be positive");
        }

        return [`--bandwidth`, value];
    }

    private afterburner(value) {
        if (value == true) {
            return [`--afterburner`, `1`];
        }
        else {
            return [`--afterburner`, `0`];
        }
    }

    private lowdelaySbr(value) {
        if (value != -1 && value != 0 && value != 1) {
            throw new Error("fdkaac: Invalid option: 'lowdelaySbr' have to be -1, 0 or 1");
        }

        return [`--lowdelay-sbr`, value];
    }

    private sbrRatio(value) {
        if (value != 0 && value != 1 && value != 2) {
            throw new Error("fdkaac: Invalid option: 'sbrRatio' have to be 0, 1 or 2");
        }

        return [`--sbr-ratio`, value];
    }

    private transportFormat(value) {
        if (value != 0 && value != 1 && value != 2 && value != 6 && value != 7 && value != 10) {
            throw new Error("fdkaac: Invalid option: 'transportFormat' have to be 0, 1, 2, 6, 7 or 10");
        }

        return [`--transport-format`, value];
    }

    private adtsCrcCheck(value) {
        if (value == true) {
            return [`--adts-crc-check`];
        }
        else {
            return undefined;
        }
    }

    private headerPeriod(value) {
        return [`--header-period`, value];
    }

    private gaplessMode(value) {
        if (value != 0 && value != 1 && value != 2) {
            throw new Error("fdkaac: Invalid option: 'gaplessMode' have to be 0, 1 or 2");
        }

        return [`--gapless-mode`, value];
    }

    private includeSbrDelay(value) {
        if (value == true) {
            return [`--include-sbr-delay`];
        }
        else {
            return undefined;
        }
    }

    private ignorelength(value) {
        if (value == true) {
            return [`--ignorelength`];
        }
        else {
            return undefined;
        }
    }

    private moovBeforeMdat(value) {
        if (value == true) {
            return [`--moov-before-mdat`];
        }
        else {
            return undefined;
        }
    }

    private raw(value) {
        if (value == true) {
            return [`--raw`];
        }
        else {
            return undefined;
        }
    }

    private rawChannels(value) {
        if (value < 1) {
            throw new Error("fdkaac: Invalid option: 'rawChannels' have to be positive");
        }

        return [`--raw-channels`, value];
    }

    private rawRate(value) {
        if (value < 1) {
            throw new Error("fdkaac: Invalid option: 'rawRate' have to be positive");
        }

        return [`--raw-rate`, value];
    }

    private rawFormat(value) {
        return [`--raw-format`, `'${value}'`];
    }

    private meta(metaObj) {
        for (const key in metaObj) {
            const value = metaObj[key];

            if (key != "title" && key != "artist" && key != "album" && key != "genre" && key != "date" && key != "composer" && key != "grouping" && key != "comment" && key != "album-artist" && key != "track" && key != "disk" && key != "tempo" && key != "tag" && key != "tag-from-file" && key != "long-tag") {
                throw new Error(`Invalid option: 'meta' unknown property '${key}'`);
            }

            const arg0 = `--${key}`;
            const arg1 = `'${value}'`;

            this.args.push(arg0);
            this.args.push(arg1);
        }

        return undefined;
    }
}

export { FdkaacOptions };
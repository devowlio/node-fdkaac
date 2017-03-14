"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * All options of node-fdkaac; build argument array for binary
 *
 * @class FdkaacOptions
 */
var FdkaacOptions = (function () {
    /**
     * Validate all options and build argument array for binary
     * @param {Object} options
     */
    function FdkaacOptions(options) {
        this.args = [];
        // Output is required
        if (options.output == undefined) {
            throw new Error("fdkaac: Invalid option: 'output' is required");
        }
        // Save options as arguments
        for (var key in options) {
            var value = options[key];
            var arg = void 0;
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
                for (var i in arg) {
                    this.args.push(arg[i]);
                }
            }
        }
    }
    /**
     * Get all arguments for binary
     */
    FdkaacOptions.prototype.getArguments = function () {
        return this.args;
    };
    FdkaacOptions.prototype.output = function (value) {
        if (value != "buffer") {
            return ["-o", "" + value];
        }
    };
    FdkaacOptions.prototype.profile = function (value) {
        if (value != 2 && value != 5 && value != 29 && value != 23 && value != 39) {
            throw new Error("fdkaac: Invalid option: 'profile' have to be 2, 5, 29, 23 or 39");
        }
        return ["--profile", value];
    };
    FdkaacOptions.prototype.bitrate = function (value) {
        if (value < 1) {
            throw new Error("fdkaac: Invalid option: 'birate' have to be positive");
        }
        return ["--bitrate", value];
    };
    FdkaacOptions.prototype.bitrateMode = function (value) {
        if (value < 0 || value > 5) {
            throw new Error("Invalid option: 'bitrateMode' have to be betweet 0 and 5");
        }
        return ["--bitrate-mode", value];
    };
    FdkaacOptions.prototype.bandwidth = function (value) {
        if (value < 1) {
            throw new Error("fdkaac: Invalid option: 'bandwidth' have to be positive");
        }
        return ["--bandwidth", value];
    };
    FdkaacOptions.prototype.afterburner = function (value) {
        if (value == true) {
            return ["--afterburner", "1"];
        }
        else {
            return ["--afterburner", "0"];
        }
    };
    FdkaacOptions.prototype.lowdelaySbr = function (value) {
        if (value != -1 && value != 0 && value != 1) {
            throw new Error("fdkaac: Invalid option: 'lowdelaySbr' have to be -1, 0 or 1");
        }
        return ["--lowdelay-sbr", value];
    };
    FdkaacOptions.prototype.sbrRatio = function (value) {
        if (value != 0 && value != 1 && value != 2) {
            throw new Error("fdkaac: Invalid option: 'sbrRatio' have to be 0, 1 or 2");
        }
        return ["--sbr-ratio", value];
    };
    FdkaacOptions.prototype.transportFormat = function (value) {
        if (value != 0 && value != 1 && value != 2 && value != 6 && value != 7 && value != 10) {
            throw new Error("fdkaac: Invalid option: 'transportFormat' have to be 0, 1, 2, 6, 7 or 10");
        }
        return ["--transport-format", value];
    };
    FdkaacOptions.prototype.adtsCrcCheck = function (value) {
        if (value == true) {
            return ["--adts-crc-check"];
        }
        else {
            return undefined;
        }
    };
    FdkaacOptions.prototype.headerPeriod = function (value) {
        return ["--header-period", value];
    };
    FdkaacOptions.prototype.gaplessMode = function (value) {
        if (value != 0 && value != 1 && value != 2) {
            throw new Error("fdkaac: Invalid option: 'gaplessMode' have to be 0, 1 or 2");
        }
        return ["--gapless-mode", value];
    };
    FdkaacOptions.prototype.includeSbrDelay = function (value) {
        if (value == true) {
            return ["--include-sbr-delay"];
        }
        else {
            return undefined;
        }
    };
    FdkaacOptions.prototype.ignorelength = function (value) {
        if (value == true) {
            return ["--ignorelength"];
        }
        else {
            return undefined;
        }
    };
    FdkaacOptions.prototype.moovBeforeMdat = function (value) {
        if (value == true) {
            return ["--moov-before-mdat"];
        }
        else {
            return undefined;
        }
    };
    FdkaacOptions.prototype.raw = function (value) {
        if (value == true) {
            return ["--raw"];
        }
        else {
            return undefined;
        }
    };
    FdkaacOptions.prototype.rawChannels = function (value) {
        if (value < 1) {
            throw new Error("fdkaac: Invalid option: 'rawChannels' have to be positive");
        }
        return ["--raw-channels", value];
    };
    FdkaacOptions.prototype.rawRate = function (value) {
        if (value < 1) {
            throw new Error("fdkaac: Invalid option: 'rawRate' have to be positive");
        }
        return ["--raw-rate", value];
    };
    FdkaacOptions.prototype.rawFormat = function (value) {
        return ["--raw-format", "'" + value + "'"];
    };
    FdkaacOptions.prototype.meta = function (metaObj) {
        for (var key in metaObj) {
            var value = metaObj[key];
            if (key != "title" && key != "artist" && key != "album" && key != "genre" && key != "date" && key != "composer" && key != "grouping" && key != "comment" && key != "album-artist" && key != "track" && key != "disk" && key != "tempo" && key != "tag" && key != "tag-from-file" && key != "long-tag") {
                throw new Error("Invalid option: 'meta' unknown property '" + key + "'");
            }
            var arg0 = "--" + key;
            var arg1 = "'" + value + "'";
            this.args.push(arg0);
            this.args.push(arg1);
        }
        return undefined;
    };
    return FdkaacOptions;
}());
exports.FdkaacOptions = FdkaacOptions;
//# sourceMappingURL=FdkaacOptions.js.map
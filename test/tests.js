const testCase = require("mocha").describe;
const pre = require("mocha").before;
const assertions = require("mocha").it;
const assert = require("chai").assert;
const fs = require("fs");
const fsp = require("fs-promise");
const util = require("util");

const Fdkaac = require("../index").Fdkaac;

testCase("Fdkaac class", () => {
    testCase("Encode to .m4a", () => {
        const TESTFILE = "./test/example.wav";
        const OUTPUTFILE = "./test/encoded.m4a";
        const TESTFILE_DURATION = 12; //Audio duration of the Testfile in seconds
        const RESULT_DURATION_TOLERANCE = 1; //Max difference between Testfile duration and converted file duration in seconds

        /**
         * @testname Option output required
         * Call Fdkaac constructor with empty options obbject
         */
        assertions("Option output required", () => {
            let errorCaught = false;

            try {
                const instance = new Fdkaac({});
            } catch (error) {
                errorCaught = true;
                const expected = "fdkaac: Invalid option: 'output' is required";
                const actuall = error.message;

                assert.equal(actuall, expected);
            }

            assert.isTrue(errorCaught);
        });

        /**
         * @testname Set not existing file
         * Try to convert not existing file
         */
        assertions("Set not existing file", () => {
            let errorCaught = false;

            try {
                const instance = new Fdkaac({
                    output: OUTPUTFILE
                });

                instance.setFile("./test/not-existing.wav");
            } catch (error) {
                errorCaught = true;
                const expected = "Audio file (path) dose not exist";
                const actuall = error.message;

                assert.equal(actuall, expected);
            }

            assert.isTrue(errorCaught);
        });

        /**
         * @testname Set invalid wav file
         * Try to convert a .wav file that contains invalid audio data
         */
        assertions("Set invalid wav file", () => {
            let errorCaught = false;
            const targetBitrate = 128;

            const instance = new Fdkaac({
                output: OUTPUTFILE,
                bitrate: targetBitrate
            });

            instance.setFile("./test/notAWavFile.wav");

            return instance
                .encode()
                .then(() => {
                    assert.isTrue(errorCaught);
                })
                .catch(error => {
                    errorCaught = true;

                    const expected = "fdkaac: ERROR: unsupported input file";
                    const actuall = error;

                    assert.equal(actuall, expected);
                    assert.isTrue(errorCaught);
                });
        });

        /**
         * @testname Encode file to file
         * Convert a .wav file to a .m4a file
         */
        assertions("Encode file to file", () => {
            const targetBitrate = 128;

            const instance = new Fdkaac({
                output: OUTPUTFILE,
                bitrate: targetBitrate
            });

            instance.setFile(TESTFILE);

            return instance.encode().then(() => {
                // Test expected file duration
                return fsp.stat(OUTPUTFILE).then(stats => {
                    const size = stats.size;
                    const resultDuration = (size * 8) / (targetBitrate * 1000);
                    fs.unlinkSync(OUTPUTFILE);

                    const isDurationWithinTolerance =
                        TESTFILE_DURATION - resultDuration <
                            RESULT_DURATION_TOLERANCE &&
                        TESTFILE_DURATION - resultDuration >
                            -1 * RESULT_DURATION_TOLERANCE;
                    assert.isTrue(isDurationWithinTolerance);
                });
            });
        });

        /**
         * @testname Encode file to file low bitrate
         * Convert a .wav file to a .m4a file with only 64 kbps
         */
        assertions("Encode file to file low bitrate", () => {
            const targetBitrate = 64;

            const instance = new Fdkaac({
                output: OUTPUTFILE,
                bitrate: targetBitrate
            });

            instance.setFile(TESTFILE);

            return instance.encode().then(() => {
                // Test expected file duration
                return fsp.stat(OUTPUTFILE).then(stats => {
                    const size = stats.size;
                    const resultDuration = (size * 8) / (targetBitrate * 1000);
                    fs.unlinkSync(OUTPUTFILE);

                    const isDurationWithinTolerance =
                        TESTFILE_DURATION - resultDuration <
                            RESULT_DURATION_TOLERANCE &&
                        TESTFILE_DURATION - resultDuration >
                            -1 * RESULT_DURATION_TOLERANCE;
                    assert.isTrue(isDurationWithinTolerance);
                });
            });
        });

        /**
         * @testname Encode file to file high bitrate
         * Convert a .wav file to a .m4a file with only 500 kbps
         */
        assertions("Encode file to file high bitrate", () => {
            const targetBitrate = 500;

            const instance = new Fdkaac({
                output: OUTPUTFILE,
                bitrate: targetBitrate
            });

            instance.setFile(TESTFILE);

            return instance.encode().then(() => {
                // Test expected file duration
                return fsp.stat(OUTPUTFILE).then(stats => {
                    const size = stats.size;
                    const resultDuration = (size * 8) / (targetBitrate * 1000);
                    fs.unlinkSync(OUTPUTFILE);

                    const isDurationWithinTolerance =
                        TESTFILE_DURATION - resultDuration <
                            RESULT_DURATION_TOLERANCE &&
                        TESTFILE_DURATION - resultDuration >
                            -1 * RESULT_DURATION_TOLERANCE;
                    assert.isTrue(isDurationWithinTolerance);
                });
            });
        });

        /**
         * @testname Encode file to buffer
         * Convert a .wav file to a buffer
         */
        assertions("Encode file to buffer", () => {
            const targetBitrate = 128;
            const output = "buffer";

            const instance = new Fdkaac({
                output: output,
                bitrate: targetBitrate
            });

            instance.setFile(TESTFILE);

            return instance.encode().then(() => {
                // Test expected file duration
                const buffer = instance.getBuffer();

                const size = buffer.byteLength;
                resultDuration = (size * 8) / (targetBitrate * 1000);

                const isDurationWithinTolerance =
                    TESTFILE_DURATION - resultDuration <
                        RESULT_DURATION_TOLERANCE &&
                    TESTFILE_DURATION - resultDuration >
                        -1 * RESULT_DURATION_TOLERANCE;
                assert(isDurationWithinTolerance);
            });
        });

        /**
         * @testname Encode buffer to file
         * Read a .wav file into a buffer. Then convert the buffer to a .m4a file.
         */
        assertions("Encode buffer to file", () => {
            const targetBitrate = 128;

            return fsp.readFile(TESTFILE).then(inputBuffer => {
                const instance = new Fdkaac({
                    output: OUTPUTFILE,
                    bitrate: targetBitrate
                });

                instance.setBuffer(inputBuffer);

                return instance.encode().then(() => {
                    // Test expected file duration
                    return fsp.stat(OUTPUTFILE).then(stats => {
                        const size = stats.size;
                        const resultDuration =
                            (size * 8) / (targetBitrate * 1000);
                        fs.unlinkSync(OUTPUTFILE);

                        const isDurationWithinTolerance =
                            TESTFILE_DURATION - resultDuration <
                                RESULT_DURATION_TOLERANCE &&
                            TESTFILE_DURATION - resultDuration >
                                -1 * RESULT_DURATION_TOLERANCE;
                        assert.isTrue(isDurationWithinTolerance);
                    });
                });
            });
        });

        /**
         * @testname Encode buffer to buffer
         * Read a .wav file into a buffer. Then convert the buffer to a buffer containing .m4a data.
         */
        assertions("Encode buffer to buffer", () => {
            const targetBitrate = 128;

            return fsp.readFile(TESTFILE).then(inputBuffer => {
                const instance = new Fdkaac({
                    output: "buffer",
                    bitrate: targetBitrate
                });
                instance.setBuffer(inputBuffer);

                return instance.encode().then(() => {
                    // Test expected file duration
                    const buffer = instance.getBuffer();

                    const size = buffer.byteLength;
                    const resultDuration = (size * 8) / (targetBitrate * 1000);

                    const isDurationWithinTolerance =
                        TESTFILE_DURATION - resultDuration <
                            RESULT_DURATION_TOLERANCE &&
                        TESTFILE_DURATION - resultDuration >
                            -1 * RESULT_DURATION_TOLERANCE;
                    assert.isTrue(isDurationWithinTolerance);
                });
            });
        });
    });

    testCase("Decode to .wav", () => {
        const TESTFILE = "./test/example.m4a";
        const OUTPUTFILE = "./test/decoded.wav";

        const TESTFILE_DURATION = 12; //Audio duration of the Testfile in seconds
        const RESULT_DURATION_TOLERANCE = 1; //Max difference between Testfile duration and converted file duration in seconds
        const EXPECTED_WAV_SIZE = 2146382; //Size of an correctly converted wav file in bytes
        const WAV_SIZE_TOLERANCE = 500; //Max difference between EXPECTED_WAV_SIZE and the actual size of the converted file

        /**
         * @testname Set invalid wav file
         * Try to convert a .m4a file that contains invalid audio data
         */
        assertions("Set invalid m4a file", () => {
            let errorCaught = false;
            const targetBitrate = 128;

            const instance = new Fdkaac({
                output: OUTPUTFILE,
                bitrate: targetBitrate
            });

            instance.setFile("./test/notAM4aFile.m4a");

            return instance.decode().catch(error => {
                errorCaught = true;

                const expected = undefined;
                const actuall = error.message;

                assert.equal(actuall, expected);
                assert.isTrue(errorCaught);
            });
        });

        /**
         * @testname Decode file to file
         * Convert a .m4a file to a .wav file
         */
        assertions("Decode file to file", () => {
            const targetBitrate = 128;

            const instance = new Fdkaac({
                output: OUTPUTFILE,
                bitrate: targetBitrate
            });

            instance.setFile(TESTFILE);

            return instance.decode().then(() => {
                // Test expected file size
                return fsp.stat(OUTPUTFILE).then(stats => {
                    fs.unlinkSync(OUTPUTFILE);

                    const actualSize = stats.size;
                    const isSizeWithinTolerance =
                        EXPECTED_WAV_SIZE - actualSize < WAV_SIZE_TOLERANCE &&
                        EXPECTED_WAV_SIZE - actualSize >
                            -1 * WAV_SIZE_TOLERANCE;

                    assert.isTrue(isSizeWithinTolerance);
                });
            });
        });

        /**
         * @testname Decode file to buffer
         * Convert a .m4a file to a buffer
         */
        assertions("Decode file to buffer", () => {
            const targetBitrate = 128;
            const output = "buffer";

            const instance = new Fdkaac({
                output: output,
                bitrate: targetBitrate
            });

            instance.setFile(TESTFILE);

            return instance.decode().then(() => {
                // Test expected file size
                const buffer = instance.getBuffer();

                const actualSize = buffer.byteLength;
                const isSizeWithinTolerance =
                    EXPECTED_WAV_SIZE - actualSize < WAV_SIZE_TOLERANCE &&
                    EXPECTED_WAV_SIZE - actualSize > -1 * WAV_SIZE_TOLERANCE;
                assert.isTrue(isSizeWithinTolerance);
            });
        });

        /**
         * @testname Decode buffer to file
         * Read a .m4a file into a buffer. Then convert the buffer to a .wav file.
         */
        assertions("Decode buffer to file", () => {
            const targetBitrate = 128;

            return fsp.readFile(TESTFILE).then(inputBuffer => {
                const instance = new Fdkaac({
                    output: OUTPUTFILE,
                    bitrate: targetBitrate
                });

                instance.setBuffer(inputBuffer);

                return instance.decode().then(() => {
                    // Test expected file size
                    return fsp.stat(OUTPUTFILE).then(stats => {
                        fs.unlinkSync(OUTPUTFILE);

                        const actualSize = stats.size;
                        const isSizeWithinTolerance =
                            EXPECTED_WAV_SIZE - actualSize <
                                WAV_SIZE_TOLERANCE &&
                            EXPECTED_WAV_SIZE - actualSize >
                                -1 * WAV_SIZE_TOLERANCE;
                        assert.isTrue(isSizeWithinTolerance);
                    });
                });
            });
        });

        /**
         * @testname Decode buffer to buffer
         * Read a .m4a file into a buffer. Then convert the buffer to a buffer containing .wav data.
         */
        assertions("Decode buffer to buffer", () => {
            const targetBitrate = 128;

            return fsp.readFile(TESTFILE).then(inputBuffer => {
                const instance = new Fdkaac({
                    output: "buffer",
                    bitrate: targetBitrate
                });
                instance.setBuffer(inputBuffer);

                return instance.decode().then(() => {
                    // Test expected file size
                    const buffer = instance.getBuffer();

                    const actualSize = buffer.byteLength;
                    const isSizeWithinTolerance =
                        EXPECTED_WAV_SIZE - actualSize < WAV_SIZE_TOLERANCE &&
                        EXPECTED_WAV_SIZE - actualSize >
                            -1 * WAV_SIZE_TOLERANCE;
                    assert.isTrue(isSizeWithinTolerance);
                });
            });
        });
    });

    testCase("Other", () => {
        const TESTFILE = "./test/example.wav";
        const OUTPUTFILE = "./test/encoded.m4a";

        /**
         * @testname Option bitrate is required
         * Call Fdkaac constructor with no bitrate specified in options object
         */
        assertions("Option bitrate is required", () => {
            let errorCaught = false;

            const instance = new Fdkaac({
                output: OUTPUTFILE
            });

            instance.setFile("./test/notAWavFile.wav");

            return instance
                .encode()
                .then(() => {
                    assert.isTrue(errorCaught);
                })
                .catch(error => {
                    errorCaught = true;

                    const expected =
                        "fdkaac: bitrate or bitrate-mode is mandatory";
                    const actuall = error;

                    assert.equal(actuall, expected);
                    assert.isTrue(errorCaught);
                });
        });

        /**
         * @testname Get status object before start
         * Setup the converter properly, then read the status object without calling the encode function.
         */
        assertions("Get status object before start", () => {
            const targetBitrate = 128;

            const instance = new Fdkaac({
                output: OUTPUTFILE,
                bitrate: targetBitrate
            });

            instance.setFile(TESTFILE);

            const actual = instance.getStatus();

            const expected = {
                started: false,
                finished: false,
                progress: undefined,
                eta: undefined
            };

            assert.deepEqual(actual, expected);
        });

        /**
         * @testname Get status object during convertion
         * Setup the converter properly, call the encode function and immediately read the status object.
         */
        assertions("Get status object during convertion", () => {
            const targetBitrate = 128;

            const instance = new Fdkaac({
                output: OUTPUTFILE,
                bitrate: targetBitrate
            });

            instance.setFile(TESTFILE);
            const emitter = instance.getEmitter();

            instance.encode().then(() => {
                fs.unlinkSync(OUTPUTFILE);
            });

            const actual = instance.getStatus();
            const expected = {
                started: true,
                finished: false,
                progress: 0,
                eta: undefined
            };

            assert.deepEqual(actual, expected);

            // Ensure next test will executed after finishing encoding
            return new Promise((resolve, rejetct) => {
                emitter.on("finish", resolve);
            });
        });

        /**
         * @testname Get status object after convertion
         * Setup the converter properly, call the encode function and read the status object afterwards.
         */
        assertions("Get status object after convertion", () => {
            const targetBitrate = 128;

            const instance = new Fdkaac({
                output: OUTPUTFILE,
                bitrate: targetBitrate
            });

            instance.setFile(TESTFILE);

            return instance.encode().then(() => {
                const actual = instance.getStatus();

                const expected = {
                    started: true,
                    finished: true,
                    progress: 100,
                    eta: "00:00"
                };

                assert.deepEqual(actual, expected);
                fs.unlinkSync(OUTPUTFILE);
            });
        });

        /**
         * @testname Get status eventEmitter successful convertion
         * Setup the converter properly, call the encode function and check if progress and finish were emitted.
         */
        assertions("Get status eventEmitter successful convertion", () => {
            const targetBitrate = 128;

            const instance = new Fdkaac({
                output: OUTPUTFILE,
                bitrate: targetBitrate
            });

            instance.setFile(TESTFILE);

            const emitter = instance.getEmitter();

            let progressTriggered = false;
            let finishTriggered = false;

            emitter.on("progress", () => {
                progressTriggered = true;
            });

            emitter.on("finish", () => {
                finishTriggered = true;

                fs.unlinkSync(OUTPUTFILE);
            });

            emitter.on("error", error => {
                assert.isTrue(false);
            });

            return instance.encode().then(() => {
                // error expected is irrelevant for this test
                assert.isTrue(progressTriggered);
                assert.isTrue(finishTriggered);
            });
        });

        /**
         * @testname Get status eventEmitter unsuccessful convertion
         * Setup the converter with invalid source file, call the encode function and check if an error is emitted.
         */
        assertions("Get status eventEmitter unsuccessful convertion", () => {
            const targetBitrate = 128;

            const instance = new Fdkaac({
                output: OUTPUTFILE,
                bitrate: targetBitrate
            });

            instance.setFile("./test/notAWavFile.wav");

            const emitter = instance.getEmitter();

            let errorTriggered = false;

            emitter.on("error", error => {
                errorTriggered = true;
            });

            return instance.encode().catch(() => {
                assert.isTrue(errorTriggered);
            });
        });

        /**
         * @testname Options
         * Specifiy optional Options and check if they are set in the options object.
         */
        assertions("Options", () => {
            const targetBitrate = 128;

            const instance = new Fdkaac({
                output: OUTPUTFILE,
                bitrate: targetBitrate,
                bandwidth: 5,
                profile: 39,
                "bitrate-mode": 4,
                afterburner: 0,
                "lowdelay-sbr": 1,
                "sbr-ratio": 2,
                "transport-format": 10,
                "adts-crc-check": true,
                "header-period": 2,
                "gapless-mode": 1,
                "include-sbr-delay": true,
                ignorelength: true,
                "moov-before-mdat": true,
                raw: true,
                "raw-channels": 1,
                "raw-rate": 88200,
                "raw-format": "S8L",
                meta: {
                    title: "test title",
                    artist: "test artist",
                    album: "test album",
                    genre: "test genre",
                    date: "01-01-2000",
                    composer: "test composer",
                    grouping: "test group",
                    comment: "test comment",
                    "album-artist": "test album-artist",
                    track: "4/8",
                    disk: "4/9",
                    tempo: 42,
                    tag: "test tag",
                    "long-tag": "test artist"
                }
            });

            instance.setFile(TESTFILE);

            expected = [
                "-o",
                "./test/encoded.m4a",
                "--bitrate",
                128,
                "--bandwidth",
                5,
                "--profile",
                39,
                "--bitrate-mode",
                4,
                "--afterburner",
                "0",
                "--lowdelay-sbr",
                1,
                "--sbr-ratio",
                2,
                "--transport-format",
                10,
                "--adts-crc-check",
                "--header-period",
                2,
                "--gapless-mode",
                1,
                "--include-sbr-delay",
                "--ignorelength",
                "--moov-before-mdat",
                "--raw",
                "--raw-channels",
                1,
                "--raw-rate",
                88200,
                "--raw-format",
                "'S8L'",
                "--title",
                "'test title'",
                "--artist",
                "'test artist'",
                "--album",
                "'test album'",
                "--genre",
                "'test genre'",
                "--date",
                "'01-01-2000'",
                "--composer",
                "'test composer'",
                "--grouping",
                "'test group'",
                "--comment",
                "'test comment'",
                "--album-artist",
                "'test album-artist'",
                "--track",
                "'4/8'",
                "--disk",
                "'4/9'",
                "--tempo",
                "'42'",
                "--tag",
                "'test tag'",
                "--long-tag",
                "'test artist'"
            ];

            const actual = instance.args;

            assert.deepEqual(expected, actual);
        });
    });
});

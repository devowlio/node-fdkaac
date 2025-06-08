# node-fdkaac

<img align="right" src="https://assets.devowl.io/git/node-fdkaac/logo.png" alt="node-fdkaac logo" height="180" />

Fraunhofer FDK AAC is a high-quality open-source AAC encoder. For all AAC and M4A encoding needs, a Node.js wrapper of the full [fdkaac](https://github.com/nu774/fdkaac) command line frontend (by [nu774](https://github.com/nu774)) based on [libfdk-aac](https://github.com/mstorsjo/fdk-aac) encoder.

The encoder reads linear PCM audio in either WAV, raw PCM or CAF format and encodes it into an M4A or an AAC file.

## Requirements

-   Linux or MacOS (Windows is NOT support by this package)
-   libfdk-aac, fdkaac and ffmpeg installed (instructions see below)
-   node 18.20.\* or newer

## Installation

You can install it with `npm`:

```bash
$ npm install --save node-fdkaac
```

If you have not installed [libfdk-aac](https://github.com/mstorsjo/fdk-aac), [fdkaac](https://github.com/nu774/fdkaac) and [ffmpeg](https://www.ffmpeg.org/) yet, you find a bash script to compile the source code as `install.sh` in this package.

_install.sh requirements:_

-   automake
-   libtool
-   git

### Run on Debian

```bash
$ sudo apt-get install automake libtool git ffmpeg
$ chmod +x install.sh
$ sudo ./install.sh
```

### Run on MacOS with brew

```bash
$ brew install automake libtool git ffmpeg
$ chmod +x install.sh
$ sudo ./install.sh
```

## Example

### Encode from file to file

```node
const Fdkaac = require("node-fdkaac").Fdkaac;

const encoder = new Fdkaac({
    output: "./audio-files/demo.m4a",
    bitrate: 192,
}).setFile("./audio-files/demo.wav");

encoder
    .encode()
    .then(() => {
        // Encoding finished
    })
    .catch((error) => {
        // Something went wrong
    });
```

### Encode from file to buffer

```node
const Fdkaac = require("node-fdkaac").Fdkaac;

const encoder = new Fdkaac({
    output: "buffer",
    bitrate: 192,
}).setFile("./audio-files/demo.wav");

encoder
    .encode()
    .then(() => {
        // Encoding finished
        const buffer = encoder.getBuffer();
    })
    .catch((error) => {
        // Something went wrong
    });
```

### Encode from buffer to file

```node
[...]

const Fdkaac = require("node-fdkaac").Fdkaac;

const encoder = new Fdkaac({
    "output": "./audio-files/demo.m4a",
    "bitrate": 192
}).setBuffer(audioFileBuffer);

encoder.encode()
    .then(() => {
        // Encoding finished
    })
    .catch((error) => {
        // Something went wrong
    });
```

### Encode from buffer to buffer

```node
[...]

const Fdkaac = require("node-fdkaac").Fdkaac;

const encoder = new Fdkaac({
    "output": "buffer",
    "bitrate": 192
}).setBuffer(audioFileBuffer);

encoder.encode()
    .then(() => {
        // Encoding finished
        const buffer = encoder.getBuffer();
    })
    .catch((error) => {
        // Something went wrong
    });
```

### Get status of encoder as object

```node
const Fdkaac = require("node-fdkaac").Fdkaac;

const encoder = new Fdkaac({
    output: "buffer",
    bitrate: 192,
}).setFile("./audio-files/demo.wav");

encoder
    .encode()
    .then(() => {
        // Encoding finished
    })
    .catch((error) => {
        // Something went wrong
    });

const status = encoder.getStatus();
```

### Get status of encoder as EventEmitter

```node
const Fdkaac = require("node-fdkaac").Fdkaac;

const encoder = new Fdkaac({
    output: "buffer",
    bitrate: 192,
}).setFile("./audio-files/demo.wav");

const emitter = encoder.getEmitter();

emitter.on("progress", ([progress, eta]) => {
    // On progress of encoding; in percent and estimated time of arrival as 00:00
});

emitter.on("finish", () => {
    // On finish
});

emitter.on("error", (error) => {
    // On error
});

encoder
    .encode()
    .then(() => {
        // Encoding finished
    })
    .catch((error) => {
        // Something went wrong
    });
```

### Decode from file to file

```node
const Fdkaac = require("node-fdkaac").Fdkaac;

const decoder = new Fdkaac({
    output: "./audio-files/demo.wav",
}).setFile("./audio-files/demo.m4a");

decoder
    .decode()
    .then(() => {
        // Decoding finished
    })
    .catch((error) => {
        // Something went wrong
    });
```

### Decode from file to buffer

```node
const Fdkaac = require("node-fdkaac").Fdkaac;

const decoder = new Lame({
    output: "buffer",
}).setFile("./audio-files/demo.m4a");

decoder
    .decode()
    .then(() => {
        // Decoding finished
        const buffer = decoder.getBuffer();
    })
    .catch((error) => {
        // Something went wrong
    });
```

### Decode from buffer to file

```node
[...]

const Fdkaac = require("node-fdkaac").Fdkaac;

const decoder = new Lame({
    "output": "./audio-files/demo.wav"
}).setBuffer(m4aInputBuffer);

decoder.decode()
    .then(() => {
        // Decoding finished
    })
    .catch((error) => {
        // Something went wrong
    });
```

### Decode from buffer to buffer

```node
[...]

const Fdkaac = require("node-fdkaac").Fdkaac;

const decoder = new Lame({
    "output": "buffer"
}).setBuffer(mp4aInputBuffer);

decoder.decode()
    .then(() => {
        // Decoding finished
        const buffer = decoder.getBuffer();
    })
    .catch((error) => {
        // Something went wrong
    });
```

## All options

| Option            | Description                                                                                                                                                         | Values                                                                                                                      | Default     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------- |
| output            | Output filename                                                                                                                                                     | Path                                                                                                                        |
| profile           | Target profile (MPEG4 audio object type, AOT)                                                                                                                       | `2` (MPEG-4 AAC LC), `5` (MPEG-4 HE-AAC; SBR), `23` (MPEG-4 AAC LD), `29` (MPEG-4 HE-AAC v2; SBR+PS), `39` (MPEG-4 AAC ELD) | `2`         |
| bitrate           | Target bitrate (for CBR)                                                                                                                                            | Number                                                                                                                      | `undefined` |
| bitrate-mode      | Bitrate configuration mode. Available VBR quality value depends on other parameters such as profile, sample rate, or number of channels.                            | `0` (CBR), `1`-`5` (VBR; higher value => higher bitrate)                                                                    | `0`         |
| bandwidth         | Frequency bandwidth (lowpass cut-off frequency) in Hz. Available on AAC LC only.                                                                                    | Number                                                                                                                      | `undefined` |
| afterburner       | Configure afterburner mode. When enabled, quality is increased at the expense of additional computational workload.                                                 | `0` (Off), `1` (On)                                                                                                         | `1`         |
| lowdelay-sbr      | Configure SBR activity on AAC ELD.                                                                                                                                  | `-1` (Use ELD SBR auto configuration, `0` (Disable SBR on ELD), `1` (Enable SBR on ELD)                                     | `0`         |
| sbr-ratio         | Controls activation of downsampled SBR.                                                                                                                             | `0` (Use lib default), `1` (Use downsampled SBR; default for ELD+SBR), `2` (Use dual-rate SBR; default for HE-AAC)          | `0`         |
| transport-format  | Transport format. Tagging and gapless playback is only available on M4A.                                                                                            | `0` (M4A), `1` (ADIF), `2` (ADTS), `6` (LATM MCP=1), `7` (LATM MCP=0), `10` (LOAS/LATM; LATM within LOAS)                   | `0`         |
| adts-crc-check    | Add CRC protection on ADTS header.                                                                                                                                  | Boolean                                                                                                                     | `false`     |
| header-period     | StreamMuxConfig/PCE repetition period in the transport layer.                                                                                                       | Number                                                                                                                      | `undefined` |
| gapless-mode      | Method to declare amount of encoder delay (and padding) in M4A container. These values are mandatory for proper gapless playback on player side.                    | `0` (iTunSMPB), `1` (ISO standard; edts and sgpd), `2` (Both)                                                               | `0`         |
| include-sbr-delay | When specified, count SBR decoder delay in encoder delay.                                                                                                           | Boolean                                                                                                                     | `false`     |
| ignorelength      | Ignore length field of data chunk in input WAV file.                                                                                                                | Boolean                                                                                                                     | `false`     |
| moov-before-mdat  | Place moov box before mdat box in M4A container. This option might be important for some hardware players, that are known to refuse moov box placed after mdat box. | Boolean                                                                                                                     | `false`     |
| raw               | Regard input as raw PCM.                                                                                                                                            | Boolean                                                                                                                     | `false`     |
| raw-channels      | Specify number of channels of raw input                                                                                                                             | Number                                                                                                                      | `2`         |
| raw-rate          | Specify sample rate of raw input.                                                                                                                                   | Number                                                                                                                      | `44100`     |
| raw-format        | Specify sample format of raw input (details see [nu774/fdkaac](https://github.com/nu774/fdkaac/blob/master/README)).                                                | String                                                                                                                      | `S16L`      |
| meta              | Meta data for M4A container.                                                                                                                                        | Object                                                                                                                      | `undefined` |

_Meta options_

| Option       | Description                                                                                                                                                        | Values            | Default     |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------- | ----------- |
| title        | Set title tag.                                                                                                                                                     | String            | `undefined` |
| artist       | Set artist tag.                                                                                                                                                    | String            | `undefined` |
| album        | Set album tag.                                                                                                                                                     | String            | `undefined` |
| genre        | Set genre tag.                                                                                                                                                     | String            | `undefined` |
| date         | Set date tag.                                                                                                                                                      | String            | `undefined` |
| composer     | Set composer tag.                                                                                                                                                  | String            | `undefined` |
| grouping     | Set grouping tag.                                                                                                                                                  | String            | `undefined` |
| comment      | Set comment tag.                                                                                                                                                   | String            | `undefined` |
| album-artist | Set album artist tag.                                                                                                                                              | String            | `undefined` |
| track        | Set track tag, with or without number of total tracks.                                                                                                             | Number[/Total]    | `undefined` |
| disk         | Set disk tag, with or without number of total discs.                                                                                                               | Number[/Total]    | `undefined` |
| tempo        | Set tempo (BPM) tag.                                                                                                                                               | Number            | `undefined` |
| tag          | Set iTunes predefined tag with explicit fourcc key and value. See [iTunesMetadata](https://code.google.com/p/mp4v2/wiki/iTunesMetadata) for known predefined keys. | \<fcc\>:\<value\> | `undefined` |
| long-tag     | Set arbitrary tag as iTunes custom metadata. Stored in com.apple.iTunes field.                                                                                     | \<fcc\>:\<value\> | `undefined` |

Option description text from [fdkaac](https://github.com/nu774/fdkaac) by [nu774](https://github.com/nu774). Based on fdkaac commit [4682fe4](https://github.com/nu774/fdkaac/tree/4682fe4961b92d3872e47d9fd4d9256151d292e7) from Jan 16, 2017.

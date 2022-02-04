import { Chunk, IFF } from "./IFF";
import { AudioSampleBuffer } from "../util/AudioSample";

class RIFFChunk extends Chunk {
  constructor(length: number) {
    super("RIFF", 4, true);
    // overwrite length of generated RIFF chunk to contain size of remaining chunks
    this.data.setUint32(4, length + 4, true);
    this.setString("WAVE");
  }
}

class FormatChunk extends Chunk {
  constructor(options: {
    // TODO: take from audio
    numChannels: 1;
    sampleRate: 44100;
    bitDepth: 16;
  }) {
    super("fmt ", 16, true);

    this.setUint16(1); // compression code
    this.setUint16(options.numChannels);
    this.setUint32(options.sampleRate);
    this.setUint32(
      options.numChannels * options.sampleRate * (options.bitDepth / 8)
    ); // avg bps
    this.setUint16(options.numChannels * (options.bitDepth / 8)); // block align
    this.setUint16(options.bitDepth);
  }
}

class DataChunk extends Chunk {
  sampleOffsets: number[];

  constructor(options: { buffers: AudioSampleBuffer[]; bitDepth: 16 }) {
    // TODO: support multiple channels, bit depths
    super(
      "data",
      options.buffers.reduce((length, buffer) => {
        return length + buffer.length * (options.bitDepth / 8);
      }, 0),
      true
    );

    this.sampleOffsets = new Array<number>();
    for (const buffer of options.buffers) {
      // Calculate sample offsets for use in cue chunk. Numbers are sample offsets, not byte offsets.
      this.sampleOffsets.push((this.offset - 8) / (options.bitDepth / 8));

      buffer.convertToMono();
      for (let i = 0; i < buffer.length; i++) {
        const sample = buffer.sampleAtIndex(0, i, options.bitDepth);
        switch (options.bitDepth) {
          case 16:
            this.setInt16(sample);
            break;
        }
      }
    }
  }
}

class CueChunk extends Chunk {
  constructor(offsets: number[]) {
    super("cue ", 12 + 24 * offsets.length, true);

    this.setUint32(offsets.length);
    offsets.forEach((offset, i) => {
      this.setUint32(i + 1); // name
      this.setUint32(i + 1); // play order
      this.setString("data"); // corresponding chunk ID
      this.setUint32(0); // chunk start, maps to unused "wavl" chunk
      this.setUint32(0); // block start, maps to unused "wavl" chunk
      this.setUint32(offset); // sample offset
    });
  }
}

export class WAV extends IFF {
  toBlob(): Promise<Blob> {
    return new Promise<Blob>((resolve) => {
      const chunks = new Array<Chunk>();
      chunks.push(
        new FormatChunk({ numChannels: 1, sampleRate: 44100, bitDepth: 16 })
      );
      const dataChunk = new DataChunk({ buffers: this.buffers, bitDepth: 16 });
      chunks.push(dataChunk);
      if (this.buffers.length > 0) {
        chunks.push(new CueChunk(dataChunk.sampleOffsets));
      }
      chunks.unshift(
        new RIFFChunk(
          chunks.reduce((length, chunk) => length + chunk.data.byteLength, 0)
        )
      );

      return resolve(
        new Blob(
          chunks.map((chunk) => chunk.data),
          { type: "audio/wav" }
        )
      );
    });
  }
}

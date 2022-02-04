import { Chunk, IFF } from "./IFF";

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
    this.setUint32(options.numChannels * options.sampleRate * 2); // avg bps
    this.setUint16(options.numChannels * 2); // block align
    this.setUint16(options.bitDepth);
  }
}

class DataChunk extends Chunk {
  sampleOffsets: number[];

  constructor(options: { buffers: AudioBuffer[]; bitDepth: 16 }) {
    // TODO: support multiple channels, bit depths
    super(
      "data",
      options.buffers.reduce((length, buffer) => {
        return length + buffer.getChannelData(0).length * 2;
      }, 0),
      true
    );

    this.sampleOffsets = new Array<number>();
    for (const buffer of options.buffers) {
      // Calculate sample offsets for use in cue chunk. Numbers are sample offsets, not byte offsets.
      this.sampleOffsets.push((this.offset - 8) / (options.bitDepth / 8));

      const channelData = buffer.getChannelData(0);
      const sampleMax = 2 ** options.bitDepth / 2;
      for (let i = 0; i < channelData.length; i++) {
        // convert float32 sample to integer of provided bit depth
        const clamped = Math.max(-1, Math.min(1, channelData[i]));
        const sample =
          0.5 + clamped < 0 ? clamped * sampleMax : clamped * (sampleMax - 1);
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

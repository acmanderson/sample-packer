import { Chunk, IFF } from "./IFF";
import { AudioSampleBuffer } from "../util/AudioSample";

class FormChunk extends Chunk {
  constructor(length: number) {
    super("FORM", 4);
    // overwrite length of generated FORM chunk to contain size of remaining chunks
    this.data.setUint32(4, length);
    this.setString("AIFF");
  }
}

class CommonChunk extends Chunk {
  constructor(options: {
    // TODO: take from audio
    numSampleFrames: number;
    numChannels: 1;
    sampleRate: 44100;
    bitDepth: 16;
  }) {
    super("COMM", 18);

    this.setUint16(options.numChannels);
    this.setUint32(options.numSampleFrames);
    this.setUint16(options.bitDepth);
    // TODO: support other sample rates, need to figure out how to write 80-bit float
    this.setUint32(0x400eac44); // 4 bytes of 44100
    this.setUint32(0x00000000); // 4 bytes of 44100
    this.setUint16(0x0000); // 2 bytes of 44100
  }
}

class SoundDataChunk extends Chunk {
  constructor(options: { buffers: AudioSampleBuffer[]; bitDepth: 16 }) {
    super(
      "SSND",
      options.buffers.reduce((length, buffer) => {
        return length + buffer.length * (options.bitDepth / 8);
      }, 8)
    );

    this.setUint32(0); // offset
    this.setUint32(0); // block size

    for (const buffer of options.buffers) {
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

export interface ApplicationData {
  signature: string;
  data: DataView;
}

class ApplicationChunk extends Chunk {
  constructor(applicationData: ApplicationData) {
    super("APPL", 4 + applicationData.data.byteLength);

    this.setString(applicationData.signature);
    for (let i = 0; i < applicationData.data.byteLength; i++) {
      this.setUint8(applicationData.data.getUint8(i));
    }
  }
}

export class AIFF extends IFF {
  applicationData?: ApplicationData;

  constructor(
    buffers: AudioSampleBuffer[],
    options?: { applicationData?: ApplicationData }
  ) {
    super(buffers);

    this.applicationData = options?.applicationData;
  }

  toBlob(): Promise<Blob> {
    return new Promise<Blob>((resolve) => {
      const chunks = new Array<Chunk>();
      chunks.push(
        new CommonChunk({
          numSampleFrames: this.buffers.reduce((total, buffer) => {
            return total + buffer.length;
          }, 0),
          numChannels: 1,
          sampleRate: 44100,
          bitDepth: 16,
        }),
        new SoundDataChunk({ buffers: this.buffers, bitDepth: 16 })
      );
      if (this.applicationData) {
        chunks.push(new ApplicationChunk(this.applicationData));
      }
      chunks.unshift(
        new FormChunk(
          chunks.reduce((length, chunk) => length + chunk.data.byteLength, -8)
        )
      );

      return resolve(
        new Blob(
          chunks.map((chunk) => chunk.data),
          { type: "audio/aiff" }
        )
      );
    });
  }
}

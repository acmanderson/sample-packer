export class AudioSample {
  audioContext: AudioContext;

  name?: string;
  audioBuffer?: AudioSampleBuffer;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  get duration(): number {
    return this.audioBuffer?.duration || 0;
  }

  decodeFile(file: File): Promise<void> {
    this.name = file.name;
    return file.arrayBuffer().then((audioData) =>
      this.audioContext.decodeAudioData(audioData).then((audioBuffer) => {
        this.audioBuffer = new AudioSampleBuffer(audioBuffer);
      })
    );
  }

  play() {
    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffer!.audioBuffer;
    source.connect(this.audioContext.destination);
    source.start();
  }
}

export class AudioSampleGroup {
  samples: AudioSample[];

  constructor() {
    this.samples = [];
  }

  swap(a: number, b: number) {
    if (
      a < 0 ||
      a > this.samples.length - 1 ||
      b < 0 ||
      b > this.samples.length - 1
    ) {
      return;
    }

    [this.samples[a], this.samples[b]] = [this.samples[b], this.samples[a]];
  }

  add(...samples: AudioSample[]) {
    this.samples.push(...samples);
  }

  remove(i: number) {
    this.samples.splice(i, 1);
  }

  buffers(): AudioSampleBuffer[] {
    return this.samples
      .filter((sample) => !!sample.audioBuffer)
      .map((sample) => sample.audioBuffer!);
  }
}

export class AudioSampleBuffer {
  audioBuffer: AudioBuffer;

  constructor(audioBuffer: AudioBuffer) {
    this.audioBuffer = audioBuffer;
  }

  get duration(): number {
    return this.audioBuffer.duration;
  }

  get length(): number {
    return this.audioBuffer.length;
  }

  convertToMono() {
    if (this.audioBuffer.numberOfChannels === 1) {
      return;
    }

    // average samples from each channel to make mono sample
    const newBuffer = new Float32Array(this.audioBuffer.length);
    for (let i = 0; i < this.audioBuffer.length; i++) {
      let sampleTotal = 0;
      for (
        let channel = 0;
        channel < this.audioBuffer.numberOfChannels;
        channel++
      ) {
        sampleTotal += this.audioBuffer.getChannelData(channel)[i];
      }
      newBuffer[i] = sampleTotal / this.audioBuffer.numberOfChannels;
    }

    this.audioBuffer = new AudioBuffer({
      length: this.audioBuffer.length,
      sampleRate: this.audioBuffer.sampleRate,
      numberOfChannels: 1,
    });
    this.audioBuffer.copyToChannel(newBuffer, 0);
  }

  sampleAtIndex(channel: number, sampleIndex: number, bitDepth: 16): number {
    // convert float32 sample to integer of provided bit depth
    const sampleMax = 2 ** bitDepth / 2;
    const sample = this.audioBuffer.getChannelData(channel)[sampleIndex];
    return sample < 0 ? sample * sampleMax : sample * (sampleMax - 1);
  }
}

export class AudioSample {
  audioContext: AudioContext;

  name?: string;
  audioBuffer?: AudioBuffer;

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
        this.audioBuffer = audioBuffer;
      })
    );
  }

  play() {
    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffer!;
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

  buffers(): AudioBuffer[] {
    return this.samples
      .filter((sample) => !!sample.audioBuffer)
      .map((sample) => sample.audioBuffer!);
  }
}

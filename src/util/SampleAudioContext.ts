export default class SampleAudioContext extends AudioContext {
  decodeArrayBuffer(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    return this.decodeAudioData(arrayBuffer);
  }

  decodeFile(file: File): Promise<AudioBuffer> {
    return file
      .arrayBuffer()
      .then((arrayBuffer) => this.decodeArrayBuffer(arrayBuffer));
  }

  playBuffer(buffer: AudioBuffer) {
    const source = this.createBufferSource();
    source.buffer = buffer;
    source.connect(this.destination);
    source.start();
  }
}

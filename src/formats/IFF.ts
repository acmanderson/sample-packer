export class Chunk {
  data: DataView;
  littleEndian: boolean;

  offset: number = 0;

  constructor(name: string, length: number, littleEndian?: boolean) {
    this.data = new DataView(new ArrayBuffer(4 + 4 + length));
    this.littleEndian = !!littleEndian;

    this.setString(name);
    this.setUint32(length);
  }

  setString(value: string) {
    for (let i = 0; i < value.length; i++) {
      this.setUint8(value.codePointAt(i) || 0);
    }
  }

  setUint8(value: number) {
    this.data.setUint8(this.offset, value);
    this.offset += 1;
  }

  setUint16(value: number) {
    this.data.setUint16(this.offset, value, this.littleEndian);
    this.offset += 2;
  }

  setUint32(value: number) {
    this.data.setUint32(this.offset, value, this.littleEndian);
    this.offset += 4;
  }

  setInt16(value: number) {
    this.data.setInt16(this.offset, value, this.littleEndian);
    this.offset += 2;
  }
}

export class IFF {
  buffers: AudioBuffer[];

  constructor(buffers: AudioBuffer[]) {
    this.buffers = buffers;
  }

  toBlob(): Blob {
    return new Blob();
  }
}

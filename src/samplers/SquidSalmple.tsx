import React, { useState } from "react";
import { Button, FormControl, InputGroup, Stack } from "react-bootstrap";
import JSZip from "jszip";
import { WAV } from "../formats/WAV";
import { saveAs } from "file-saver";
import { SampleGroup } from "../components/SampleGroup";
import SampleAudioContext from "../util/SampleAudioContext";

export interface SamplerProps {
  audioContext: SampleAudioContext;
}

interface SampleState {
  name: string;
  buffer: AudioBuffer;
}

export function SquidSalmple(props: SamplerProps) {
  const [sampleGroups, setSampleGroups] = useState<SampleState[][]>(
    // implicitly fill array to let us use map() below, since map() doesn't work on an array with unassigned values
    [...new Array<SampleState[]>(8)]
  );
  const [bankNum, setBankNum] = useState(0);
  const [packName, setPackName] = useState("Sample Pack");

  const { audioContext } = props;
  return (
    <>
      <InputGroup className="mb-3">
        <InputGroup.Text>Bank</InputGroup.Text>
        <FormControl
          type="number"
          min={1}
          max={99}
          placeholder="86"
          onChange={(event) => {
            setBankNum(parseInt(event.target.value));
          }}
        />
      </InputGroup>
      <InputGroup className="mb-3">
        <InputGroup.Text>Pack Name</InputGroup.Text>
        <FormControl
          placeholder="Sample Pack"
          onChange={(event) => {
            setPackName(event.target.value);
          }}
        />
      </InputGroup>
      <Stack direction={"vertical"} gap={3}>
        {sampleGroups.map((sampleGroup, i) => (
          <SampleGroup
            key={i}
            id={i + 1}
            onDrop={async (files: File[]) => {
              sampleGroups[i] = (
                sampleGroup || new Array<SampleState>()
              ).concat(
                await Promise.all(
                  files.map((file) =>
                    audioContext.decodeFile(file).then(
                      (decodedBuffer): SampleState => ({
                        name: file.name,
                        buffer: decodedBuffer,
                      })
                    )
                  )
                )
              );
              setSampleGroups([...sampleGroups]);
            }}
            samples={sampleGroup?.map((sample, j) => {
              return {
                name: sample.name,
                onPlay: () => {
                  audioContext.playBuffer(sample.buffer);
                },
                onDelete: () => {
                  sampleGroups[i].splice(j, 1);
                  setSampleGroups([...sampleGroups]);
                },
                onShift: (direction) => {
                  if (
                    (direction === "left" && j === 0) ||
                    (direction === "right" && j === sampleGroups[i].length - 1)
                  ) {
                    return;
                  }

                  const shift = direction === "left" ? -1 : 1;
                  [sampleGroups[i][j + shift], sampleGroups[i][j]] = [
                    sampleGroups[i][j],
                    sampleGroups[i][j + shift],
                  ];
                  setSampleGroups([...sampleGroups]);
                },
              };
            })}
          />
        ))}
        <Button
          onClick={() => {
            const zip = new JSZip();
            const bankName = `Bank ${bankNum || "XX"}`;
            const pack = zip.folder(bankName);

            pack?.file("info.txt", packName);
            sampleGroups.forEach((sample, i) => {
              if (sample) {
                const wav = new WAV(sample.map((s) => s.buffer));
                pack?.file(`chan-00${i + 1}.wav`, wav.toBlob());
              }
            });

            zip.generateAsync({ type: "blob" }).then((content) => {
              saveAs(content, bankName);
            });
          }}
        >
          Save
        </Button>
      </Stack>
    </>
  );
}

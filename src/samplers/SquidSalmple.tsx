import React, { useState } from "react";
import { Button, FormControl, InputGroup, Stack } from "react-bootstrap";
import JSZip from "jszip";
import { WAV } from "../formats/WAV";
import { saveAs } from "file-saver";
import { SampleGroup } from "../components/SampleGroup";
import { AudioSample, AudioSampleGroup } from "../util/AudioSample";

export interface SamplerProps {
  audioContext: AudioContext;
}

export function SquidSalmple(props: SamplerProps) {
  const [sampleGroups, setSampleGroups] = useState<AudioSampleGroup[]>(
    Array.from({ length: 8 }, () => new AudioSampleGroup())
  );
  const [bankNum, setBankNum] = useState(0);
  const [packName, setPackName] = useState("Sample Pack");
  const [saving, setSaving] = useState(false);

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
            name={`Channel ${i + 1}`}
            onDrop={async (files: File[]) => {
              Promise.all(
                files.map((file) => {
                  const sample = new AudioSample(audioContext);
                  return sample.decodeFile(file).then(() => sample);
                })
              ).then((samples) => {
                sampleGroup.add(...samples);
                setSampleGroups([...sampleGroups]);
              });
            }}
            onReorder={(a, b) => {
              sampleGroup.swap(a, b);
              setSampleGroups([...sampleGroups]);
            }}
            samples={sampleGroup?.samples.map((sample, i) => {
              return {
                sample: sample,
                onDelete: () => {
                  sampleGroup.remove(i);
                  setSampleGroups([...sampleGroups]);
                },
                onShiftLeft: () => {
                  sampleGroup.swap(i, i - 1);
                  setSampleGroups([...sampleGroups]);
                },
                onShiftRight: () => {
                  sampleGroup.swap(i, i + 1);
                  setSampleGroups([...sampleGroups]);
                },
              };
            })}
          />
        ))}
        <Button
          disabled={saving}
          onClick={() => {
            setSaving(true);

            const zip = new JSZip();
            const bankName = `Bank ${bankNum || "XX"}`;
            const pack = zip.folder(bankName);
            pack?.file("info.txt", packName);

            Promise.all(
              sampleGroups.map((sampleGroup, i) => {
                const buffers = sampleGroup.buffers();
                if (buffers.length > 0) {
                  const wav = new WAV(buffers);
                  return wav.toBlob().then((blob) => {
                    pack?.file(`chan-00${i + 1}.wav`, blob);
                  });
                }
                return new Promise<void>((resolve) => {
                  resolve();
                });
              })
            ).then(() => {
              zip.generateAsync({ type: "blob" }).then((content) => {
                saveAs(content, bankName);
                setSaving(false);
              });
            });
          }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </>
  );
}

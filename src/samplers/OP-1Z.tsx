import { SamplerProps } from "./SquidSalmple";
import React, { useState } from "react";
import {
  AudioSample,
  AudioSampleBuffer,
  AudioSampleGroup,
} from "../util/AudioSample";
import { Button, FormControl, InputGroup, Stack } from "react-bootstrap";
import { SampleGroup } from "../components/SampleGroup";
import { AIFF, ApplicationData } from "../formats/AIFF";
import { saveAs } from "file-saver";

const numSamples = 24;

function buildMetadata(buffers: AudioSampleBuffer[]): Promise<ApplicationData> {
  return new Promise((resolve) => {
    const baseMetadata: any = {
      drum_version: 1,
      type: "drum",
      name: "user",
      octave: 0,
      pitch: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ],
      playmode: [
        8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192,
        8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192,
      ],
      reverse: [
        8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192,
        8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192,
      ],
      volume: [
        8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192,
        8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192, 8192,
      ],
      dyna_env: [0, 8192, 0, 8192, 0, 0, 0, 0],
      fx_active: false,
      fx_type: "delay",
      fx_params: [8000, 8000, 8000, 8000, 8000, 8000, 8000, 8000],
      lfo_active: false,
      lfo_type: "tremolo",
      lfo_params: [16000, 16000, 16000, 16000, 0, 0, 0, 0],
    };

    // mark start and end times of each sample to play back per-key
    [baseMetadata.start, baseMetadata.end] = buffers.reduce(
      ([startTimes, endTimes], buffer, i) => {
        // these values are kind of a mystery
        const timeScale = (2 ** 31 - 1) / 12;
        const timePadding = 4058;

        let start: number, end: number;
        if (!!buffer) {
          start = i > 0 ? endTimes[i - 1] + timePadding : 0;
          end = Math.ceil(start + buffer.duration * timeScale);
        } else {
          start = i > 0 ? startTimes[i - 1] : 0;
          end = i > 0 ? endTimes[i - 1] : 0;
        }

        [startTimes[i], endTimes[i]] = [start, end];
        return [startTimes, endTimes];
      },
      [new Array<number>(numSamples), new Array<number>(numSamples)]
    );

    const metadata = JSON.stringify(baseMetadata);
    resolve({
      signature: "op-1",
      data: new DataView(
        Uint8Array.from(
          { length: metadata.length },
          (_, i) => metadata.codePointAt(i)!
        ).buffer
      ),
    });
  });
}

export function OP1Z(props: SamplerProps) {
  const [sampleGroups, setSampleGroups] = useState<AudioSampleGroup[]>(
    Array.from({ length: numSamples }, () => new AudioSampleGroup())
  );
  const [patchName, setPatchName] = useState("patch");
  const [saving, setSaving] = useState(false);

  const { audioContext } = props;
  return (
    <>
      <InputGroup className="mb-3">
        <InputGroup.Text>Patch Name</InputGroup.Text>
        <FormControl
          placeholder="Patch Name"
          onChange={(event) => {
            setPatchName(event.target.value);
          }}
        />
      </InputGroup>
      <Stack direction={"vertical"} gap={3}>
        {sampleGroups.map((sampleGroup, i) => (
          <SampleGroup
            key={i}
            name={`${i + 1}`}
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
          disabled={
            saving /* FIXME: this doesn't rerender for some reason when calling setSaving() */
          }
          onClick={() => {
            setSaving(true);

            const buffers = sampleGroups.map(
              (sampleGroup) => sampleGroup.buffers()[0]
            );

            if (buffers.length > 0) {
              buildMetadata(buffers)
                .then((metadata) =>
                  new AIFF(
                    buffers.filter((buffer) => !!buffer),
                    {
                      applicationData: metadata,
                    }
                  ).toBlob()
                )
                .then((blob) => {
                  saveAs(blob, `${patchName}.aif`);
                  setSaving(false);
                });
            }
          }}
        >
          {saving ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </>
  );
}

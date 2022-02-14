import React, { useState } from "react";
import { SamplerProps } from "./SquidSalmple";
import { AudioSample, AudioSampleGroup } from "../util/AudioSample";
import { Button, FormControl, InputGroup, Stack } from "react-bootstrap";
import { AIFF, ApplicationData } from "../formats/AIFF";
import { saveAs } from "file-saver";
import { Sample } from "../components/Sample";

const NUM_SAMPLES = 24;
const NOTES: { name: string; theme: "light" | "dark" }[] = [
  { name: "F", theme: "light" },
  { name: "F#", theme: "dark" },
  { name: "G", theme: "light" },
  { name: "G#", theme: "dark" },
  { name: "A", theme: "light" },
  { name: "A#", theme: "dark" },
  { name: "B", theme: "light" },
  { name: "C", theme: "light" },
  { name: "C#", theme: "dark" },
  { name: "D", theme: "light" },
  { name: "D#", theme: "dark" },
  { name: "E", theme: "light" },
];

function buildMetadata(
  sampleGroup: AudioSampleGroup
): Promise<ApplicationData> {
  // FIXME: times are weird if first sample is not populated
  // FIXME: clicking at sample end when imported to OP-1, need to adjust end time?
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
    [baseMetadata.start, baseMetadata.end] = sampleGroup.samples.reduce(
      ([startTimes, endTimes], sample, i) => {
        // the origin of these values is kind of a mystery
        // max int32 / max number of seconds in an OP-1 sample file
        const timeScale = (2 ** 31 - 1) / 12;
        // timeScale / 44100 (OP-1 sample rate)
        const timePadding = 4058;

        let start: number, end: number;
        if (!!sample?.audioBuffer) {
          // time padding logic inferred from looking at OP-1 Drum Utility hex dumps
          // add time padding at the start of every sample after the first
          start = i > 0 ? endTimes[i - 1] + timePadding : 0;
          // subtract twice the time padding from the end of a sample marker to prevent clicks at the end of a sample
          end =
            Math.ceil(start + sample.duration * timeScale) - timePadding * 2;
        } else {
          start = i > 0 ? startTimes[i - 1] : 0;
          end = i > 0 ? endTimes[i - 1] : 0;
        }

        [startTimes[i], endTimes[i]] = [start, end];
        return [startTimes, endTimes];
      },
      [new Array<number>(NUM_SAMPLES), new Array<number>(NUM_SAMPLES)]
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
  const [sampleGroup, setSampleGroup] = useState(
    new AudioSampleGroup(
      new Array<AudioSample | undefined>(NUM_SAMPLES).fill(undefined)
    )
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
        <Sample.Group>
          <Sample.Group.Header>{`${patchName}.aif`}</Sample.Group.Header>
          <Sample.Group.Body>
            <Sample.Group.DragDrop
              direction={"vertical"}
              onDragEnd={({ source, destination }) => {
                if (!!destination) {
                  sampleGroup.move(source.index, destination.index);
                  setSampleGroup(sampleGroup.clone());
                }
              }}
            >
              {sampleGroup?.samples.map((sample, i) => {
                const note = NOTES[i % NOTES.length];
                return sample ? (
                  <Sample key={i} theme={note.theme}>
                    <Sample.Header>{`${note.name} (${sample.name})`}</Sample.Header>
                    <Sample.Body>
                      <Sample.Controls>
                        <Sample.Controls.Up
                          onClick={() => {
                            sampleGroup.move(i, i - 1);
                            setSampleGroup(sampleGroup.clone());
                          }}
                        />
                        <Sample.Controls.Down
                          onClick={() => {
                            sampleGroup.move(i, i + 1);
                            setSampleGroup(sampleGroup.clone());
                          }}
                        />
                        <Sample.Controls.Play onClick={() => sample.play()} />
                        <Sample.Controls.Delete
                          onClick={() => {
                            sampleGroup.clear(i);
                            setSampleGroup(sampleGroup.clone());
                          }}
                        />
                      </Sample.Controls>
                    </Sample.Body>
                  </Sample>
                ) : (
                  <Sample key={i} theme={note.theme}>
                    <Sample.Header>{note.name}</Sample.Header>
                    <Sample.Body>
                      <Sample.Dropzone
                        audioContext={audioContext}
                        multiple={false}
                        onDrop={(samples) => {
                          sampleGroup.set(i, samples[0]);
                          setSampleGroup(sampleGroup.clone());
                        }}
                      >
                        {({ getRootProps, getInputProps, isDragActive }) => (
                          <div {...getRootProps()}>
                            <input {...getInputProps()} />
                            {isDragActive
                              ? "Drop sample here..."
                              : "Drag sample here or click to select."}
                          </div>
                        )}
                      </Sample.Dropzone>
                    </Sample.Body>
                  </Sample>
                );
              })}
            </Sample.Group.DragDrop>
          </Sample.Group.Body>
        </Sample.Group>
        <Button
          disabled={
            saving /* FIXME: this doesn't rerender for some reason when calling setSaving() */
          }
          onClick={() => {
            setSaving(true);

            if (sampleGroup.samples.some((sample) => !!sample)) {
              buildMetadata(sampleGroup)
                .then((metadata) =>
                  new AIFF(sampleGroup.buffers(), {
                    applicationData: metadata,
                  }).toBlob()
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

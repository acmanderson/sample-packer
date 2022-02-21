import React, { useContext, useState } from "react";
import { AudioSample, AudioSampleGroup } from "../util/AudioSample";
import { Alert, Button, FormControl, InputGroup, Stack } from "react-bootstrap";
import { AIFF, ApplicationData } from "../formats/AIFF";
import { saveAs } from "file-saver";
import { Sample } from "../components/Sample";
import { SampleAudioContext } from "../App";
import { formatFileRejections } from "./util";

const NUM_SAMPLES = 24;
const MAX_DURATION_SECONDS = 12;
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

export function OP1Z() {
  const [sampleGroup, setSampleGroup] = useState(
    new AudioSampleGroup(
      new Array<AudioSample | undefined>(NUM_SAMPLES).fill(undefined)
    )
  );
  const [sampleGroupErrors, setSampleGroupErrors] = useState<
    Array<string | undefined>
  >(new Array<string | undefined>(NUM_SAMPLES));
  const [patchName, setPatchName] = useState("patch");
  const [saving, setSaving] = useState(false);
  const audioContext = useContext(SampleAudioContext);

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
        <Sample.Group
          border={sampleGroup.duration > MAX_DURATION_SECONDS ? "warning" : ""}
        >
          <Sample.Group.Header>{`${patchName}.aif`}</Sample.Group.Header>
          <Sample.Group.Body>
            {sampleGroup.duration > MAX_DURATION_SECONDS && (
              <Alert variant={"warning"}>
                Max patch duration ({MAX_DURATION_SECONDS}s) exceeded. Sample
                may be truncated or fail to import.
              </Alert>
            )}
            <Sample.Group.DragDrop
              direction={"vertical"}
              onDragEnd={({ source, destination }) => {
                if (!!destination) {
                  sampleGroup.move(source.index, destination.index);
                  setSampleGroup(sampleGroup.clone());

                  sampleGroupErrors[source.index] = undefined;
                  sampleGroupErrors[destination.index] = undefined;
                  setSampleGroupErrors([...sampleGroupErrors]);
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

                            sampleGroupErrors[i] = undefined;
                            sampleGroupErrors[i - 1] = undefined;
                            setSampleGroupErrors([...sampleGroupErrors]);
                          }}
                        />
                        <Sample.Controls.Down
                          onClick={() => {
                            sampleGroup.move(i, i + 1);
                            setSampleGroup(sampleGroup.clone());

                            sampleGroupErrors[i] = undefined;
                            sampleGroupErrors[i + 1] = undefined;
                            setSampleGroupErrors([...sampleGroupErrors]);
                          }}
                        />
                        <Sample.Controls.Play onClick={() => sample.play()} />
                        <Sample.Controls.Delete
                          onClick={() => {
                            sampleGroup.clear(i);
                            setSampleGroup(sampleGroup.clone());

                            sampleGroupErrors[i] = undefined;
                            setSampleGroupErrors([...sampleGroupErrors]);
                          }}
                        />
                      </Sample.Controls>
                    </Sample.Body>
                    <Sample.Footer>
                      <Sample.Duration duration={sample.duration} />
                    </Sample.Footer>
                  </Sample>
                ) : (
                  <Sample key={i} theme={note.theme}>
                    <Sample.Header>{note.name}</Sample.Header>
                    <Sample.Body>
                      {!!sampleGroupErrors[i] && (
                        <Alert
                          variant={"danger"}
                          dismissible
                          onClose={() => {
                            sampleGroupErrors[i] = undefined;
                            setSampleGroupErrors([...sampleGroupErrors]);
                          }}
                        >
                          {sampleGroupErrors[i]}
                        </Alert>
                      )}
                      <Sample.Dropzone
                        audioContext={audioContext}
                        multiple={false}
                        onDrop={(samples, fileRejections) => {
                          sampleGroup.set(i, samples[0]);
                          setSampleGroup(sampleGroup.clone());

                          if (fileRejections.length > 0) {
                            sampleGroupErrors[
                              i
                            ] = `File rejected: ${formatFileRejections(
                              fileRejections
                            )}`;
                          } else {
                            sampleGroupErrors[i] = undefined;
                          }
                          setSampleGroupErrors([...sampleGroupErrors]);
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
          <Sample.Group.Footer>
            <Sample.Duration duration={sampleGroup.duration} />
          </Sample.Group.Footer>
        </Sample.Group>
        <Button
          disabled={saving}
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

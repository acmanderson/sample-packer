import React, { useContext, useState } from "react";
import { Alert, Button, FormControl, InputGroup, Stack } from "react-bootstrap";
import JSZip from "jszip";
import { WAV } from "../formats/WAV";
import { saveAs } from "file-saver";
import { AudioSampleGroup } from "../util/AudioSample";
import { Sample } from "../components/Sample";
import { SampleAudioContext } from "../App";

const MAX_CHANNEL_DURATION_SECONDS = 11;

export function SquidSalmple() {
  const [sampleGroups, setSampleGroups] = useState<AudioSampleGroup[]>(
    Array.from({ length: 8 }, () => new AudioSampleGroup())
  );
  const [bankNum, setBankNum] = useState(0);
  const [packName, setPackName] = useState("Sample Pack");
  const [saving, setSaving] = useState(false);
  const audioContext = useContext(SampleAudioContext);

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
          <Sample.Group
            key={i}
            border={
              sampleGroup.duration > MAX_CHANNEL_DURATION_SECONDS
                ? "warning"
                : ""
            }
          >
            <Sample.Group.Header>{`Channel ${i + 1}`}</Sample.Group.Header>
            <Sample.Group.Body>
              {sampleGroup.duration > MAX_CHANNEL_DURATION_SECONDS && (
                <Alert variant={"warning"}>
                  Max channel duration ({MAX_CHANNEL_DURATION_SECONDS}s)
                  exceeded. Samples may be truncated when imported.
                </Alert>
              )}
              <Sample.Dropzone
                audioContext={audioContext}
                multiple={true}
                onDrop={(samples) => {
                  sampleGroup.add(...samples);
                  setSampleGroups([...sampleGroups]);
                }}
              >
                {({ getRootProps, getInputProps, isDragActive }) => (
                  <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    {sampleGroup.samples.length === 0 ? (
                      isDragActive ? (
                        "Drop samples here..."
                      ) : (
                        "Drag samples here or click to select."
                      )
                    ) : (
                      <></>
                    )}
                  </div>
                )}
              </Sample.Dropzone>
              <Sample.Group.DragDrop
                direction={"horizontal"}
                onDragEnd={({ source, destination }) => {
                  if (!!destination) {
                    sampleGroup.move(source.index, destination.index);
                    setSampleGroups([...sampleGroups]);
                  }
                }}
              >
                {sampleGroup?.samples.map((sample, i) => (
                  <Sample key={i}>
                    <Sample.Header>{sample?.name}</Sample.Header>
                    <Sample.Body>
                      <Sample.Controls>
                        <Sample.Controls.Left
                          onClick={() => {
                            sampleGroup.move(i, i - 1);
                            setSampleGroups([...sampleGroups]);
                          }}
                        />
                        <Sample.Controls.Right
                          onClick={() => {
                            sampleGroup.move(i, i + 1);
                            setSampleGroups([...sampleGroups]);
                          }}
                        />
                        <Sample.Controls.Play onClick={() => sample?.play()} />
                        <Sample.Controls.Delete
                          onClick={() => {
                            sampleGroup.remove(i);
                            setSampleGroups([...sampleGroups]);
                          }}
                        />
                      </Sample.Controls>
                    </Sample.Body>
                    <Sample.Footer>
                      <Sample.Duration duration={sample?.duration ?? 0} />
                    </Sample.Footer>
                  </Sample>
                ))}
              </Sample.Group.DragDrop>
            </Sample.Group.Body>
            <Sample.Group.Footer>
              <Sample.Duration duration={sampleGroup.duration} />
            </Sample.Group.Footer>
          </Sample.Group>
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

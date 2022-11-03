import { Button, Form, Stack, Alert, InputGroup } from "react-bootstrap";
import { saveAs } from "file-saver";
import React, { useContext, useState } from "react";
import { AudioSample } from "../util/AudioSample";
import StatefulList from "../util/StatefulList";
import { Sample } from "../components/Sample";
import { SampleAudioContext } from "../App";
import { WAV } from "../formats/WAV";
import { formatFileRejections } from "./util";
import JSZip from "jszip";

interface PresetOptions {
  tuned: boolean;
  legato: boolean;
  repeat: boolean;
  sync: boolean;
  "random shift": boolean;

  [key: string]: boolean;
}

interface PresetSound {
  name: string;
  bitDepth: 8 | 16;
  sample?: AudioSample;
  options: PresetOptions;
}

const DEFAULT_SOUND_OPTIONS: PresetOptions = {
  tuned: true,
  legato: false,
  repeat: false,
  sync: true,
  "random shift": false,
};

const NUM_SOUNDS = 6;

// prettier-ignore
const SAMPLE_NAME_OPTIONS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
const filenameSelectOptions = (start?: number, end?: number) => {
  const options = SAMPLE_NAME_OPTIONS.slice(
    start ?? 0,
    end ?? SAMPLE_NAME_OPTIONS.length + 1
  );
  return options.map((option, i) => <option key={i}>{option}</option>);
};

const buildPreset = (sounds: (PresetSound | undefined)[]): Blob => {
  // dumb way to represent bytes, but makes it easier to manipulate specific bits than when using BigInt
  const template =
    "011011010000001100000000000000000000000000100000000000001111111000000111000001001000001100000000";

  const preset: Uint8Array[] = sounds.map((sound) => {
    const soundBits = Array.from(template);

    // encode file name
    const name = !!sound ? sound.name : "A1";
    // file names are stored as:
    //   * 7-bit ASCII encoding of first character
    const bankBits = name.charCodeAt(0).toString(2).padStart(7, "0");
    //   * 7-bit ASCII encoding of second character
    const sampleBits = name.charCodeAt(1).toString(2).padStart(7, "0");
    const soundStart = 8 * 8 + 7;
    soundBits.splice(soundStart, 7, ...Array.from(bankBits));
    // there's a two bit gap between first char and second char, I don't yet know why
    soundBits.splice(soundStart + 7 + 2, 7, ...Array.from(sampleBits));

    const setBit = (index: number, condition?: boolean) => {
      soundBits[index] = condition ? "1" : "0";
    };
    // file names starting with a number have a specific bit unset
    setBit(87, name.charCodeAt(0) > 48);
    // set sound parameters
    setBit(69, sound?.options.tuned);
    setBit(68, sound?.options.legato);
    setBit(67, sound?.options.repeat);
    setBit(66, sound?.options.sync);
    setBit(65, sound?.options["random shift"]);

    // turn string array into bytes
    const soundData = new Uint8Array(soundBits.length / 8);
    soundData.forEach((_, i) => {
      soundData[i] = parseInt(soundBits.slice(i * 8, i * 8 + 8).join(""), 2);
    });
    return soundData;
  });

  return new Blob(preset);
};

export function Microgranny() {
  const [saving, setSaving] = useState(false);
  const [presetName, setPresetName] = useState("P01.TXT");
  const [presetSounds, setPresetSounds] = useState(
    // prettier-ignore
    new StatefulList<PresetSound>([
            {name: "00.WAV", bitDepth: 16, options: Object.assign({}, DEFAULT_SOUND_OPTIONS)},
            {name: "01.WAV", bitDepth: 16, options: Object.assign({}, DEFAULT_SOUND_OPTIONS)},
            {name: "02.WAV", bitDepth: 16, options: Object.assign({}, DEFAULT_SOUND_OPTIONS)},
            {name: "03.WAV", bitDepth: 16, options: Object.assign({}, DEFAULT_SOUND_OPTIONS)},
            {name: "04.WAV", bitDepth: 16, options: Object.assign({}, DEFAULT_SOUND_OPTIONS)},
            {name: "05.WAV", bitDepth: 16, options: Object.assign({}, DEFAULT_SOUND_OPTIONS)},
        ])
  );
  const [presetSoundErrors, setPresetSoundErrors] = useState(
    new Array<string | undefined>(NUM_SOUNDS)
  );

  const audioContext = useContext(SampleAudioContext);

  return (
    <>
      <InputGroup className={"mb-3"}>
        <InputGroup.Text>Preset Name</InputGroup.Text>
        <Form.Select
          size={"sm"}
          value={presetName.charAt(1)}
          onChange={(event) => {
            setPresetName(
              presetName.substring(0, 1) +
                event.target.value +
                presetName.substring(2, presetName.length)
            );
          }}
        >
          {filenameSelectOptions(0, 10)}
        </Form.Select>
        <Form.Select
          size={"sm"}
          value={presetName.charAt(2)}
          onChange={(event) => {
            setPresetName(
              presetName.substring(0, 2) +
                event.target.value +
                presetName.substring(3, presetName.length)
            );
          }}
        >
          {filenameSelectOptions(1, 7)}
        </Form.Select>
        <InputGroup.Text>.TXT</InputGroup.Text>
      </InputGroup>
      <Stack direction={"vertical"} gap={3}>
        <Sample.Group>
          <Sample.Group.Header>
            {presetName.substring(0, 3)}
          </Sample.Group.Header>
          <Sample.Group.Body>
            <Sample.Group.DragDrop
              direction={"vertical"}
              onDragEnd={({ source, destination }) => {
                if (!!destination) {
                  presetSounds.move(source.index, destination.index);
                  setPresetSounds(presetSounds.clone());

                  presetSoundErrors[source.index] = undefined;
                  presetSoundErrors[destination.index] = undefined;
                  setPresetSoundErrors([...presetSoundErrors]);
                }
              }}
            >
              {presetSounds.items.map((sound, i) => {
                return (
                  <Sample key={i}>
                    <Sample.Header>
                      {!sound.sample
                        ? sound.name
                        : `${sound.name} (${sound.sample.name})`}
                    </Sample.Header>
                    <Sample.Body>
                      {!!presetSoundErrors[i] && (
                        <Alert
                          variant={"danger"}
                          dismissible
                          onClose={() => {
                            presetSoundErrors[i] = undefined;
                            setPresetSoundErrors([...presetSoundErrors]);
                          }}
                        >
                          {presetSoundErrors[i]}
                        </Alert>
                      )}
                      <Stack direction={"vertical"} gap={2}>
                        <InputGroup>
                          <InputGroup.Text>File Name</InputGroup.Text>
                          <Form.Select
                            size={"sm"}
                            value={sound.name.charAt(0)}
                            onChange={(event) => {
                              sound.name =
                                event.target.value +
                                sound.name.substring(1, sound.name.length);
                              setPresetSounds(presetSounds.clone());
                            }}
                          >
                            {filenameSelectOptions()}
                          </Form.Select>
                          <Form.Select
                            size={"sm"}
                            value={sound.name.charAt(1)}
                            onChange={(event) => {
                              sound.name =
                                sound.name.substring(0, 1) +
                                event.target.value +
                                sound.name.substring(2, sound.name.length);
                              setPresetSounds(presetSounds.clone());
                            }}
                          >
                            {filenameSelectOptions()}
                          </Form.Select>
                          <InputGroup.Text>.WAV</InputGroup.Text>
                        </InputGroup>
                        <div>
                          {Object.keys(sound.options).map((option, i) => (
                            <Form.Check
                              key={i}
                              inline
                              label={option}
                              checked={sound.options[option]}
                              onChange={() => {
                                sound.options[option] = !sound.options[option];
                                setPresetSounds(presetSounds.clone());
                              }}
                            />
                          ))}
                        </div>
                        {!!sound.sample && (
                          <InputGroup>
                            <InputGroup.Text>Bit Depth</InputGroup.Text>
                            <Form.Select
                              size={"sm"}
                              value={sound.bitDepth.toString()}
                              onChange={(event) => {
                                sound.bitDepth =
                                  event.target.selectedIndex === 0 ? 8 : 16;
                                setPresetSounds(presetSounds.clone());
                              }}
                            >
                              <option>8</option>
                              <option>16</option>
                            </Form.Select>
                          </InputGroup>
                        )}
                        {!sound.sample && (
                          <Sample.Dropzone
                            audioContext={audioContext}
                            multiple={false}
                            onDrop={(samples, fileRejections) => {
                              const sound = presetSounds.items[i];
                              sound.sample = samples[0];
                              presetSounds.set(i, sound);
                              setPresetSounds(presetSounds.clone());

                              if (fileRejections.length > 0) {
                                presetSoundErrors[
                                  i
                                ] = `File rejected: ${formatFileRejections(
                                  fileRejections
                                )}`;
                              } else {
                                presetSoundErrors[i] = undefined;
                              }
                              setPresetSoundErrors([...presetSoundErrors]);
                            }}
                          >
                            {({
                              getRootProps,
                              getInputProps,
                              isDragActive,
                            }) => (
                              <div {...getRootProps({ className: "dropzone" })}>
                                <input {...getInputProps()} />
                                {isDragActive
                                  ? "Drop sample here..."
                                  : "Drag sample here or click to select."}
                              </div>
                            )}
                          </Sample.Dropzone>
                        )}
                        <Sample.Controls>
                          <Sample.Controls.Up
                            onClick={() => {
                              presetSounds.move(i, i - 1);
                              setPresetSounds(presetSounds.clone());

                              presetSoundErrors[i] = undefined;
                              presetSoundErrors[i - 1] = undefined;
                              setPresetSoundErrors([...presetSoundErrors]);
                            }}
                          />
                          <Sample.Controls.Down
                            onClick={() => {
                              presetSounds.move(i, i + 1);
                              setPresetSounds(presetSounds.clone());

                              presetSoundErrors[i] = undefined;
                              presetSoundErrors[i + 1] = undefined;
                              setPresetSoundErrors([...presetSoundErrors]);
                            }}
                          />
                          {!!sound.sample && (
                            <Sample.Controls.Play
                              onClick={() => sound.sample?.play()}
                            />
                          )}
                          {!!sound.sample && (
                            <Sample.Controls.Delete
                              onClick={() => {
                                presetSounds.items[i].sample = undefined;
                                setPresetSounds(presetSounds.clone());

                                presetSoundErrors[i] = undefined;
                                setPresetSoundErrors([...presetSoundErrors]);
                              }}
                            />
                          )}
                        </Sample.Controls>
                      </Stack>
                    </Sample.Body>
                    {!!sound.sample && (
                      <Sample.Footer>
                        <Sample.Duration
                          duration={sound.sample.duration ?? 0}
                        />
                      </Sample.Footer>
                    )}
                  </Sample>
                );
              })}
            </Sample.Group.DragDrop>
          </Sample.Group.Body>
        </Sample.Group>
        <Button
          disabled={saving}
          onClick={() => {
            setSaving(true);
            const zip = new JSZip();

            const preset = buildPreset(presetSounds.items);
            zip.file(presetName, preset);

            Promise.all(
              presetSounds.items.map((sound, i) => {
                if (!sound.sample) return Promise.resolve();

                return sound.sample.audioBuffer
                  ?.resample(22050)
                  .then(() =>
                    new WAV([sound.sample?.audioBuffer!], {
                      sampleRate: 22050,
                      bitDepth: sound.bitDepth,
                    }).toBlob()
                  )
                  .then((blob) => {
                    zip.file(sound.name, blob);
                  });
              })
            ).then(() => {
              zip.generateAsync({ type: "blob" }).then((content) => {
                saveAs(content, presetName.substring(0, 3));
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

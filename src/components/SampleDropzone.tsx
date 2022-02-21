import {
  DropEvent,
  DropzoneOptions,
  DropzoneState,
  ErrorCode,
  FileError,
  FileRejection,
  useDropzone,
} from "react-dropzone";
import { AudioSample } from "../util/AudioSample";

export type SampleDropzoneOptions = Omit<DropzoneOptions, "onDrop"> & {
  onDrop?: (
    acceptedSamples: AudioSample[],
    fileRejections: FileRejection[],
    event: DropEvent
  ) => void;
};

export function useSampleDropzone(
  audioContext: AudioContext,
  options?: SampleDropzoneOptions
): DropzoneState {
  const { onDrop, ...baseOptions } = options!;
  const dropzoneOptions = baseOptions as DropzoneOptions;
  if (!dropzoneOptions.validator) {
    dropzoneOptions.validator = (file: File): FileError | null => {
      const audio = new Audio();
      return !!audio.canPlayType(file.type)
        ? null
        : {
            code: ErrorCode.FileInvalidType,
            message: `unsupported file type: ${file.type}`,
          };
    };
  }

  if (!!onDrop) {
    dropzoneOptions.onDrop = async (acceptedFiles, fileRejections, event) => {
      onDrop(
        await Promise.all(
          acceptedFiles.map((file) => {
            const sample = new AudioSample(audioContext);
            return sample.decodeFile(file).then(() => sample);
          })
        ),
        fileRejections,
        event
      );
    };
  }

  return useDropzone(dropzoneOptions);
}

export const SampleDropzone = ({
  children,
  audioContext,
  ...opts
}: {
  children(state: DropzoneState): JSX.Element;
  audioContext: AudioContext;
} & SampleDropzoneOptions) => {
  const { ...state } = useSampleDropzone(audioContext, opts);
  return children(state);
};

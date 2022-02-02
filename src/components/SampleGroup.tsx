import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Sample, SampleProps } from "./Sample";
import { Card, Stack } from "react-bootstrap";

export interface SampleGroupProps {
  id?: number | string;
  onDrop: (files: File[]) => Promise<void>;
  samples?: SampleProps[];
}

export function SampleGroup(props: SampleGroupProps) {
  const { id, samples, onDrop } = props;
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback(
      async (acceptedFiles: File[]) => {
        await onDrop(acceptedFiles);
      },
      [onDrop]
    ),
    multiple: true,
    noClick: !!samples?.length,
  });

  return (
    <div {...getRootProps()}>
      <Card>
        <Card.Body>
          <Card.Title>{id}</Card.Title>
          <Stack direction={"horizontal"} gap={3}>
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Drop samples here...</p>
            ) : samples?.length ? (
              samples.map((sample, i) => (
                <Sample
                  key={i}
                  name={sample.name}
                  onPlay={sample.onPlay}
                  onDelete={sample.onDelete}
                  onShift={sample.onShift}
                />
              ))
            ) : (
              <p>Drag samples here, or click to select.</p>
            )}
          </Stack>
        </Card.Body>
      </Card>
    </div>
  );
}

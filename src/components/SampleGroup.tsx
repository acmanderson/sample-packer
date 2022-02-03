import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Sample, SampleProps } from "./Sample";
import { Card, Stack } from "react-bootstrap";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export interface SampleGroupProps {
  id?: number | string;
  onDrop: (files: File[]) => Promise<void>;
  onReorder: (a: number, b: number) => void;
  samples?: SampleProps[];
}

export function SampleGroup(props: SampleGroupProps) {
  const { id, samples, onDrop, onReorder } = props;
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
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop samples here...</p>
          ) : samples?.length ? (
            <DragDropContext
              onDragEnd={(result) => {
                const { source, destination } = result;
                if (!!destination) {
                  onReorder(source.index, destination.index);
                }
              }}
            >
              <Droppable droppableId={"droppable"} direction={"horizontal"}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    <Stack direction={"horizontal"} gap={3}>
                      {samples.map((sample, i) => (
                        <Draggable key={i} draggableId={i.toString()} index={i}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Sample {...sample} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {/* FIXME: placeholder padding doesn't match normal layout */}
                      {provided.placeholder}
                    </Stack>
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <p>Drag samples here, or click to select.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

import React from "react";
import { Card, Stack } from "react-bootstrap";
import {
  DragDropContext,
  DragDropContextProps,
  Draggable,
  Droppable,
} from "react-beautiful-dnd";

export const SampleGroupDragDrop = (
  props: {
    children: React.ReactNode;
    direction: "horizontal" | "vertical";
  } & DragDropContextProps
) => {
  const { children, direction, ...dragDropContextProps } = props;
  return (
    <DragDropContext {...dragDropContextProps}>
      <Droppable droppableId={"droppable"} direction={direction}>
        {(provided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            <Stack direction={direction} gap={3} style={{ overflowX: "auto" }}>
              {React.Children.map(children, (child, i) => (
                <Draggable key={i} draggableId={i.toString()} index={i}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      {child}
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
  );
};

export const SampleGroup = ({ children }: { children: React.ReactNode }) => (
  <Card>{children}</Card>
);

SampleGroup.Header = Card.Header;
SampleGroup.Body = Card.Body;
SampleGroup.DragDrop = SampleGroupDragDrop;

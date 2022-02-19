import React from "react";
import { Card, CardProps, Stack } from "react-bootstrap";
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
            <Stack direction={direction} style={{ overflowX: "auto" }}>
              {React.Children.map(children, (child, i) => (
                <Draggable key={i} draggableId={i.toString()} index={i}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      {/* use bootstrap padding instead of stack gap since react-beautiful-dnd doesn't work with flexbox gap */}
                      <div
                        className={direction === "horizontal" ? "pe-3" : "pb-3"}
                      >
                        {child}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </Stack>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export const SampleGroup = ({
  children,
  ...props
}: {
  children: React.ReactNode;
} & CardProps) => <Card {...props}>{children}</Card>;

SampleGroup.Header = Card.Header;
SampleGroup.Body = Card.Body;
SampleGroup.Footer = Card.Footer;
SampleGroup.DragDrop = SampleGroupDragDrop;

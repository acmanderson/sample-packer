import React from "react";
import { Button, ButtonGroup, Card } from "react-bootstrap";
import { SampleDropzone } from "./SampleDropzone";
import { SampleGroup } from "./SampleGroup";

export const Sample = ({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme?: "light" | "dark";
}) => (
  <Card bg={theme} text={theme && (theme === "light" ? "dark" : "light")}>
    {children}
  </Card>
);

Sample.Header = Card.Header;
Sample.Body = Card.Body;
Sample.Dropzone = SampleDropzone;
Sample.Group = SampleGroup;

export const SampleControls = ({ children }: { children: React.ReactNode }) => (
  <ButtonGroup size={"sm"}>{children}</ButtonGroup>
);

export const SampleControl =
  (icon: string) =>
  ({ onClick }: { onClick: () => void }) =>
    (
      <Button onClick={onClick}>
        <i className={icon} />
      </Button>
    );

SampleControls.Play = SampleControl("bi-play-fill");
SampleControls.Delete = SampleControl("bi-trash");
SampleControls.Up = SampleControl("bi-arrow-up");
SampleControls.Down = SampleControl("bi-arrow-down");
SampleControls.Left = SampleControl("bi-arrow-left");
SampleControls.Right = SampleControl("bi-arrow-right");

Sample.Controls = SampleControls;

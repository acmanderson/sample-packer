import { Button, ButtonGroup, Card } from "react-bootstrap";
import { AudioSample } from "../util/AudioSample";

export interface SampleProps {
  sample: AudioSample;
  onDelete: () => void;
  onShiftLeft: () => void;
  onShiftRight: () => void;
}

export function Sample(props: SampleProps) {
  const { sample, onDelete, onShiftLeft, onShiftRight } = props;
  return (
    <Card>
      <Card.Body>
        <Card.Title>{sample.name}</Card.Title>
        <ButtonGroup size="sm">
          <Button onClick={() => onShiftLeft()}>
            <i className={"bi-arrow-left"} />{" "}
          </Button>
          <Button onClick={() => onShiftRight()}>
            <i className={"bi-arrow-right"} />{" "}
          </Button>
          <Button onClick={() => sample.play()}>
            <i className={"bi-play-fill"} />{" "}
          </Button>
          <Button onClick={onDelete}>
            <i className={"bi-trash"} />{" "}
          </Button>
        </ButtonGroup>
      </Card.Body>
    </Card>
  );
}

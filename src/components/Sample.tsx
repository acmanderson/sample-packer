import { Button, ButtonGroup, Card } from "react-bootstrap";

export interface SampleProps {
  name: string;
  onPlay: () => void;
  onDelete: () => void;
  onShiftLeft: () => void;
  onShiftRight: () => void;
}

export function Sample(props: SampleProps) {
  const { name, onPlay, onDelete, onShiftLeft, onShiftRight } = props;
  return (
    <Card>
      <Card.Body>
        <Card.Title>{name}</Card.Title>
        <ButtonGroup size="sm">
          <Button onClick={() => onShiftLeft()}>
            <i className={"bi-arrow-left"} />{" "}
          </Button>
          <Button onClick={() => onShiftRight()}>
            <i className={"bi-arrow-right"} />{" "}
          </Button>
          <Button onClick={onPlay}>
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

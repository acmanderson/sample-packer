import { Button, ButtonGroup, Card } from "react-bootstrap";

export interface SampleProps {
  name: string;
  onPlay: () => void;
  onDelete: () => void;
  onShift: (direction: "left" | "right") => void;
}

export function Sample(props: SampleProps) {
  const { name, onPlay, onDelete, onShift } = props;
  return (
    <Card>
      <Card.Body>
        <Card.Title>{name}</Card.Title>
        <ButtonGroup size="sm">
          <Button onClick={() => onShift("left")}>
            <i className={"bi-arrow-left"} />{" "}
          </Button>
          <Button onClick={() => onShift("right")}>
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

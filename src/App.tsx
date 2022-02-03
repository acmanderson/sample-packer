import React, { useState, useMemo } from "react";
import {
  Container,
  DropdownButton,
  Navbar,
  NavDropdown,
} from "react-bootstrap";
import { SquidSalmple } from "./samplers/SquidSalmple";
import SampleAudioContext from "./util/SampleAudioContext";
import { Routes, Route, useNavigate } from "react-router-dom";
import DropdownItem from "react-bootstrap/DropdownItem";

function App() {
  const [audioContext] = useState(new SampleAudioContext(new AudioContext()));
  const samplers = useMemo<
    {
      name: string;
      path: string;
      element: JSX.Element;
    }[]
  >(() => {
    return [
      {
        name: "Squid Salmple",
        path: "squid-salmple",
        // TODO: use context instead of props for AudioContext?
        element: <SquidSalmple audioContext={audioContext} />,
      },
    ];
  }, [audioContext]);
  const navigate = useNavigate();

  return (
    <>
      <Navbar>
        <Container>
          <Navbar.Brand>
            <i className={"bi-vinyl-fill"} /> sample-packer
          </Navbar.Brand>
          <NavDropdown title={"Sampler"}>
            {samplers.map((sampler, i) => (
              <NavDropdown.Item key={i} onClick={() => navigate(sampler.path)}>
                {sampler.name}
              </NavDropdown.Item>
            ))}
          </NavDropdown>
        </Container>
      </Navbar>
      <Container>
        <Routes>
          <Route
            path={"/"}
            element={
              <div className="px-4 py-5 my-5 text-center">
                <h1 className="display-5 fw-bold">sample-packer</h1>
                <div className="col-lg-6 mx-auto">
                  <p className="lead mb-4">
                    sample-packer is a tool to aid in creating sample packs for
                    various hardware samplers. Pick a sampler from the dropdown
                    to get started.
                  </p>
                  <DropdownButton title={"Sampler"} size={"lg"}>
                    {samplers.map((sampler, i) => (
                      <DropdownItem
                        key={i}
                        onClick={() => navigate(sampler.path)}
                      >
                        {sampler.name}
                      </DropdownItem>
                    ))}
                  </DropdownButton>
                </div>
              </div>
            }
          />
          {samplers.map((sampler, i) => (
            <Route
              key={i}
              path={sampler.path}
              element={
                <div className="mb-3">
                  <div className="mb-3">
                    <h1 className="display-5 fw-bold">{sampler.name}</h1>
                  </div>
                  {sampler.element}
                </div>
              }
            />
          ))}
        </Routes>
      </Container>
    </>
  );
}

export default App;

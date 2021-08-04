import { EnabledOption, ToggleSharedFilterModalProps } from "./Interfaces";
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

export default function ToggleSharedFilterModal(
  props: ToggleSharedFilterModalProps
): JSX.Element {
  const [selectedOption, setSelectedOption] = useState<EnabledOption>(
    EnabledOption.Local
  );

  const mapOptionString = (option: string): EnabledOption => {
    if (option === "No, enable/disable only this filter")
      return EnabledOption.Local;
    if (option === "Yes, enable/disable the filter for all the subscribers")
      return EnabledOption.Global;

    return EnabledOption.None;
  };

  const changeOption = (event: React.ChangeEvent<HTMLInputElement>): void => {
    event.preventDefault();
    const optionStr = event.target.value;
    const option = mapOptionString(optionStr);
    setSelectedOption(option);
  };

  return (
    <Modal
      show={props.show}
      onHide={() => {
        props.closeCallback();
        setSelectedOption(EnabledOption.Local);
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          The selected filter(s) might be imported by other providers
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          {" "}
          Do you want to enable/disable the filter for all the subscribers?{" "}
        </p>
        <Form.Group controlId="enablement">
          <Form.Control as="select" onChange={changeOption}>
            <option>No, enable/disable only this filter</option>
            <option>
              Yes, enable/disable the filter for all the subscribers
            </option>
          </Form.Control>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => {
            props.closeCallback();
            setSelectedOption(EnabledOption.Local);
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            props.callback(selectedOption);
            props.closeCallback();
            setSelectedOption(EnabledOption.Local);
          }}
        >
          Submit
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

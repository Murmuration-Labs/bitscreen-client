import { EnabledOption, ToggleEnabledFilterModalProps } from "./Interfaces";
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

export default function ToggleEnabledFilterModal(
  props: ToggleEnabledFilterModalProps
): JSX.Element {
  const [selectedOption, setSelectedOption] = useState<EnabledOption>(
    EnabledOption.Local
  );

  const mapOptionString = (option: string): EnabledOption => {
    if (option === "No, enable/disable the filter only for myself")
      return EnabledOption.Local;
    if (option === "Yes, enable/disable the filter for all the providers")
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
          The selected filter is imported by other providers
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p> Do you want to enable/disable the filter for all the providers? </p>
        <Form.Group controlId="enablement">
          <Form.Control as="select" onChange={changeOption}>
            <option>No, enable/disable the filter only for myself</option>
            <option>
              Yes, enable/disable the filter for all the providers
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

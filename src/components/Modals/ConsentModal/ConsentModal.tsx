import React, { useState } from "react";
import { Modal, Button, ListGroup, Form } from "react-bootstrap";
import { Link } from "@material-ui/core";

export interface ConsentModalProps {
  show: boolean;
  callback: (consent: boolean) => void;
  closeCallback: () => void;
}

export default function ConsentModal(props: ConsentModalProps): JSX.Element {
  const [consentValue, setConsentValue] = useState<boolean>(false);

  const handleCheckboxChange = (event) => {
    setConsentValue(event.target.checked);
  };

  return (
    <Modal
      show={props.show}
      onHide={() => {
        props.closeCallback();
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Welcome to BitScreen</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          By using BitScreen, you agree to our{" "}
          <Link
            href="https://github.com/Murmuration-Labs/bitscreen/blob/master/terms_of_service.md"
            target="_blank"
          >
            Terms of Service
          </Link>{" "}
          &{" "}
          <Link
            href="https://github.com/Murmuration-Labs/bitscreen/blob/master/privacy_policy.md"
            target="_blank"
          >
            Privacy Policy
          </Link>
          . If you do not agree, you cannot use BitScreen.
        </p>
        <Form.Group className="mb-3" controlId="consentCheckbox">
          <Form.Check
            onChange={handleCheckboxChange}
            type="checkbox"
            label="I have read and agree."
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => {
            props.closeCallback();
          }}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          disabled={!consentValue}
          onClick={() => {
            props.callback(consentValue);
            props.closeCallback();
          }}
        >
          Continue
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

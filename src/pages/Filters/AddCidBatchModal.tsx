import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";

import "./Filters.css";

import { AddCidBatchModalProps } from "./Interfaces";

export default function AddCidBatchModal(
  props: AddCidBatchModalProps
): JSX.Element {
  const [cidsInput, setCidsInput] = useState<string>("");
  const [cidsInputError, setCidsInputError] = useState<boolean>(false);

  const renderCidsInputError = (): JSX.Element => {
    if (cidsInputError) {
      return (
        <span className="double-space-left text-danger">Invalid CIDs list</span>
      );
    }

    return <></>;
  };

  const addCids = (): void => {
    const match = /\r|\n|,|;|\s/.exec(cidsInput);
    if (!match) {
      setCidsInputError(true);
      return;
    }
    const result = cidsInput
      .trim()
      .split(match[0])
      .map((element: string) => {
        return element.trim();
      });
    setCidsInput("");
    props.closeCallback(result);
  };

  return (
    <Modal
      show={props.show}
      onHide={() => {
        setCidsInput("");
        props.closeCallback([]);
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Add Cid Batch</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col>
            <Form>
              <Form.Row>
                <Col>
                  <Form.Control
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setCidsInput(event.target.value);
                      if (cidsInputError) {
                        setCidsInputError(false);
                      }
                    }}
                    as="textarea"
                    placeholder="You can paste here more CIDs separated by space, newline, comma or semicolon."
                    value={cidsInput}
                  />
                  {renderCidsInputError()}
                </Col>
              </Form.Row>
            </Form>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={() => {
            setCidsInput("");
            props.closeCallback([]);
          }}
        >
          Cancel
        </Button>

        <Button
          variant="warning"
          onClick={() => addCids()}
          disabled={!cidsInput}
        >
          Add CIDs
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
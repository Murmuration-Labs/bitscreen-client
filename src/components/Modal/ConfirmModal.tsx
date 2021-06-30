import { ConfirmModalProps } from "./Interfaces";
import React from "react";
import { Modal, Button, ListGroup } from "react-bootstrap";

export default function ConfirmModal(props: ConfirmModalProps): JSX.Element {
  return (
    <Modal
      show={props.show}
      onHide={() => {
        props.closeCallback();
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>{props.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {props.message}
        {props.bullets ? (
          <ListGroup style={{ width: "100%", marginTop: 15 }}>
            <ul>
              {props.bullets.map((value, index) => (
                <li key={index}>{value}</li>
              ))}
            </ul>
          </ListGroup>
        ) : (
          ""
        )}
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
          onClick={() => {
            props.callback();
            props.closeCallback();
          }}
        >
          Ok
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

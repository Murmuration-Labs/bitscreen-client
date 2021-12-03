import { ConfirmModalProps } from "./Interfaces";
import React from "react";
import { Modal, Button, ListGroup } from "react-bootstrap";
import "./ConfirmModal.css";

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
        <div className="modal-message">{props.message}</div>
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
          {props.declineMessage || "Cancel"}
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            props.callback();
            props.closeCallback();
          }}
        >
          {props.confirmMessage || "Ok"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

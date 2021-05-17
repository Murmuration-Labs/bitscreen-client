import { ConfirmModalProps } from "./Interfaces";
import React, { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";

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
      <Modal.Body>{props.message}</Modal.Body>
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

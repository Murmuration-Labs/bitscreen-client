import React, { useState } from "react";
import { Typeahead } from "react-bootstrap-typeahead";

import { Modal, Button } from "react-bootstrap";

import { FilterList, MoveCIDModalProps } from "./Interfaces";
import FilterService from "../../services/FilterService";

export default function MoveCIDModal(props: MoveCIDModalProps): JSX.Element {
  const [selectedFilter, setSelectedFilter] = useState<FilterList>(
    FilterService.emptyFilterList()
  );

  return (
    <Modal
      show={props.show}
      onHide={() => {
        props.closeCallback();
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Move CID {props.cidItem.cid}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Typeahead
          id="typeahead-autocomplete"
          labelKey="name"
          options={props.optionFilters}
          onChange={(selected) => {
            setSelectedFilter(selected[0]);
          }}
        />
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
          onClick={async () => {
            await props.move(props.cidItem, selectedFilter);
            props.closeCallback();
          }}
          disabled={!selectedFilter._id}
        >
          Ok
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

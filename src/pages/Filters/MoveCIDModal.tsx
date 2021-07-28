import React, { useState } from "react";
import { Typeahead } from "react-bootstrap-typeahead";

import { Modal, Button } from "react-bootstrap";

import { CidItem, FilterList, MoveCIDModalProps } from "./Interfaces";
import FilterService from "../../services/FilterService";

export default function MoveCIDModal(props: MoveCIDModalProps): JSX.Element {
  const [selectedFilter, setSelectedFilter] = useState<FilterList>(
    FilterService.emptyFilterList()
  );

  const renderTitle = (cidItems: CidItem[]): JSX.Element => {
    const titleText =
      "Move " +
      cidItems.length +
      " CIDs: " +
      cidItems.reduce((result, item) => result + item.cid + ", ", "");
    return <Modal.Title>{titleText.slice(0, -2)}</Modal.Title>;
  };

  return (
    <Modal
      show={props.show}
      onHide={() => {
        props.closeCallback();
      }}
    >
      <Modal.Header closeButton>{renderTitle(props.cidItems)}</Modal.Header>
      <Modal.Body>
        <p> Choose another filter list to move CID(s): </p>
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
            await props.move(props.cidItems, selectedFilter);
            props.closeCallback();
          }}
          disabled={!selectedFilter.id}
        >
          Ok
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

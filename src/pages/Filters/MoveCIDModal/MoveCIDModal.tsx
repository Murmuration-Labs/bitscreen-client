import React, { useEffect, useState } from "react";
import { Typeahead } from "react-bootstrap-typeahead";

import { Modal, Button } from "react-bootstrap";

import { CidItem, FilterList, MoveCIDModalProps } from "../Interfaces";
import FilterService from "services/FilterService";
import LoggerService from "services/LoggerService";

export default function MoveCIDModal(props: MoveCIDModalProps): JSX.Element {
  const [selectedFilter, setSelectedFilter] = useState<Array<FilterList>>([
    FilterService.emptyFilterList(),
  ]);

  useEffect(() => {
    if (props.show) {
      LoggerService.info("Show add CID Batch modal");
    }
  }, [props.show]);

  const renderTitle = (cidItems: CidItem[]): JSX.Element => {
    const titleText =
      "Move " +
      cidItems.length +
      " CIDs: " +
      cidItems.reduce((result, item) => result + item.cid + ", ", "");
    return (
      <Modal.Title style={{ wordBreak: "break-word" }}>
        {titleText.slice(0, -2)}
      </Modal.Title>
    );
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
          onChange={setSelectedFilter}
          selected={selectedFilter}
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
            await props.move(props.cidItems, selectedFilter[0]);
            props.closeCallback();
          }}
          disabled={!selectedFilter.length}
        >
          Ok
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

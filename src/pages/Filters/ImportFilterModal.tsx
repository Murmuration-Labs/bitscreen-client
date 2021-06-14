import React, { ChangeEvent, useState } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Table,
  FormCheck,
} from "react-bootstrap";
import { css } from "@emotion/core";

import "./Filters.css";

import PuffLoader from "react-spinners/PuffLoader";
import { FilterList, ImportFilterModalProps } from "./Interfaces";
import ApiService from "../../services/ApiService";
import FilterService from "../../services/FilterService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faTrash } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

const overrideLoaderCss = css`
  display: block;
  margin: 0 auto;
  border-color: red;
  color: red;
`;

export default function ImportFilterModal(
  props: ImportFilterModalProps
): JSX.Element {
  const [remoteFilterUri, setRemoteFilterUri] = useState<string>("");
  const [remoteFilterError, setRemoteFilterError] = useState<boolean>(false);
  const [fetchedFilterList, setFetchedFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );
  const [isFetchingRemoteFilter, setIsFetchingRemoteFilter] =
    useState<boolean>(false);

  const [isSavingFetchedFilter, setIsSavingFetchedFilter] =
    useState<boolean>(false);

  const renderFilterError = (): JSX.Element => {
    if (remoteFilterError) {
      return (
        <span className="double-space-left text-danger">
          Invalid remote filter URI
        </span>
      );
    }

    return <></>;
  };

  const renderReviewFilterList = (): JSX.Element => {
    if (!fetchedFilterList.name || isSavingFetchedFilter) {
      return <></>;
    }

    return (
      <>
        <h4>Review remote filter - {fetchedFilterList.name}</h4>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>
                {fetchedFilterList.enabled ? "Enabled" : "Disabled"}
                <FormCheck
                  readOnly
                  type="switch"
                  checked={fetchedFilterList.enabled}
                  disabled
                />
              </th>
            </tr>
            <tr>
              <th>{fetchedFilterList.cids.length} CIDS</th>
            </tr>
          </thead>
          <tbody>
            {fetchedFilterList.cids.map((x) => (
              <tr>
                <td>{FilterService.renderHashedCid(x)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </>
    );
  };

  const fetchRemoteFilter = async (): Promise<void> => {
    setIsFetchingRemoteFilter(true);
    try {
      const fl = await ApiService.fetchRemoteFilter(remoteFilterUri);
      setTimeout(() => {
        // small gimmick to see loader in action
        setFetchedFilterList(fl);
        setIsFetchingRemoteFilter(false);
      }, 1500);
    } catch (e) {
      setRemoteFilterUri("");
      setRemoteFilterError(true);
      setIsFetchingRemoteFilter(false);
    }
  };

  const discardFilter = (): void => {
    setRemoteFilterUri("");
    setFetchedFilterList(FilterService.emptyFilterList());
  };

  const importFilter = async (): Promise<void> => {
    setIsSavingFetchedFilter(true);

    fetchedFilterList.origin = remoteFilterUri;

    await ApiService.addFilter(fetchedFilterList);

    setTimeout(() => {
      // small gimmick to see loader in action
      setRemoteFilterUri("");
      setFetchedFilterList(FilterService.emptyFilterList());
      setIsSavingFetchedFilter(false);

      props.closeCallback(true);
    }, 1500);
  };

  const renderActionButtons = (): JSX.Element => {
    if (!fetchedFilterList.name) {
      return (
        <>
          <Button
            variant="warning"
            onClick={fetchRemoteFilter}
            disabled={!remoteFilterUri}
          >
            Fetch remote filter
          </Button>
        </>
      );
    }

    return (
      <>
        <Button variant="danger" onClick={discardFilter}>
          <FontAwesomeIcon icon={faTrash as IconProp} />
          <span className="space-left">Discard filter</span>
        </Button>
        <Button variant="success" onClick={importFilter}>
          <FontAwesomeIcon icon={faGlobe as IconProp} />
          <span className="space-left">Import filter</span>
        </Button>
      </>
    );
  };

  return (
    <Modal
      show={props.show}
      onHide={() => {
        setRemoteFilterUri("");
        setFetchedFilterList(FilterService.emptyFilterList());
        props.closeCallback(false);
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>Import remote filter</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col>
            <Form>
              <Form.Row>
                <Col>
                  <Form.Control
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setRemoteFilterUri(event.target.value);
                      if (remoteFilterError) {
                        setRemoteFilterError(false);
                      }
                    }}
                    type="text"
                    placeholder="Remote filter URI"
                    value={remoteFilterUri}
                    disabled={
                      isFetchingRemoteFilter || !!fetchedFilterList.name
                    }
                  />
                  {renderFilterError()}
                </Col>
              </Form.Row>
            </Form>
          </Col>
        </Row>

        <Row>
          <Col className="text-center">{renderReviewFilterList()}</Col>
        </Row>

        <Row>
          <Col>
            <PuffLoader
              color={"#ffc107"}
              loading={isFetchingRemoteFilter || isSavingFetchedFilter}
              css={overrideLoaderCss}
              size={150}
            />
          </Col>
        </Row>

        <Row>
          <Col>
            <Form>
              <Form.Row>
                <Col>
                  <Form.Control
                    role="notes"
                    onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                      setFetchedFilterList({
                        ...fetchedFilterList,
                        notes: ev.target.value,
                      });
                    }}
                    as="textarea"
                    placeholder="List Notes"
                    value={fetchedFilterList.notes}
                  />
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
            setRemoteFilterUri("");
            setFetchedFilterList(FilterService.emptyFilterList());
            props.closeCallback(false);
          }}
        >
          Cancel
        </Button>

        {renderActionButtons()}
      </Modal.Footer>
    </Modal>
  );
}

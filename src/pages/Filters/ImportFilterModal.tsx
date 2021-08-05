import React, { ChangeEvent, useEffect, useState } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Table,
  FormCheck,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { css } from "@emotion/core";

import "./Filters.css";

import PuffLoader from "react-spinners/PuffLoader";
import { FilterList, ImportFilterModalProps } from "./Interfaces";
import ApiService from "../../services/ApiService";
import * as AuthService from "../../services/AuthService";
import FilterService from "../../services/FilterService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGlobe, faTrash } from "@fortawesome/free-solid-svg-icons";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { serverUri } from "../../config";

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
  const [fetchedFilterList, setFetchedFilterList] = useState<
    FilterList | undefined
  >(props.filter);
  const [isFetchingRemoteFilter, setIsFetchingRemoteFilter] =
    useState<boolean>(false);

  const [isSavingFetchedFilter, setIsSavingFetchedFilter] =
    useState<boolean>(false);

  useEffect(() => {
    setRemoteFilterUri(
      fetchedFilterList
        ? `${serverUri()}/filter/share/${fetchedFilterList?.shareId}`
        : ""
    );
  }, [fetchedFilterList]);

  useEffect(() => {
    if (!props.filter) {
      return;
    }

    ApiService.getFilter(props.filter.id).then((f) => setFetchedFilterList(f));
  }, [props.filter]);

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
    if (!fetchedFilterList?.name || isSavingFetchedFilter) {
      return <></>;
    }

    return (
      <>
        <h4>Review remote filter - {fetchedFilterList.name}</h4>
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>
                Enabled
                <FormCheck readOnly type="switch" checked={true} disabled />
              </th>
            </tr>
            <tr>
              <th>{fetchedFilterList.cids.length} CIDS</th>
            </tr>
          </thead>
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
        setFetchedFilterList({ ...fl, notes: fetchedFilterList?.notes });
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

    const currentProviderId = AuthService.getProviderId();
    if (currentProviderId === fetchedFilterList?.provider.id) {
      toast.error(
        "You cannot import your own filter! Please try to import an external filter."
      );
    } else {
      await ApiService.addProviderFilter({
        providerId: currentProviderId,
        filterId: fetchedFilterList?.id,
        notes: fetchedFilterList?.notes,
        active: !!fetchedFilterList?.enabled,
      });
    }

    setTimeout(() => {
      // small gimmick to see loader in action
      setRemoteFilterUri("");
      setFetchedFilterList(FilterService.emptyFilterList());
      setIsSavingFetchedFilter(false);

      props.closeCallback(true);
    }, 1500);
  };

  useEffect(() => {
    if (props.prefetch) {
      fetchRemoteFilter();
    }
  }, [remoteFilterUri]);

  if (props.prefetch && !remoteFilterUri) {
    setRemoteFilterUri(props.prefetch);
  }

  const renderActionButtons = (): JSX.Element => {
    if (!fetchedFilterList?.name) {
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
                      isFetchingRemoteFilter || !!fetchedFilterList?.name
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
                      if (fetchedFilterList) {
                        setFetchedFilterList({
                          ...fetchedFilterList,
                          notes: ev.target.value,
                        });
                      }
                    }}
                    as="textarea"
                    placeholder="List Notes"
                    value={fetchedFilterList?.notes}
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

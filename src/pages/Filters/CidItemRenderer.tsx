import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  ListGroup,
  OverlayTrigger,
  Row,
  Tooltip,
} from "react-bootstrap";
import PuffLoader from "react-spinners/PuffLoader";
import ApiService from "../../services/ApiService";
import FilterService from "../../services/FilterService";
import { CidItem, CidItemProps } from "./Interfaces";

// function validateCid(cid: string): boolean{
//     // :TODO: check length, check allowed characters
//     return true;
// }

const CidItemRenderer = (props: CidItemProps): JSX.Element => {
  const emptyCidItem: CidItem = {
    tableKey: "",
    cid: "",
    isChecked: false,
    isSaved: false,
  };

  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [cidItem, setCidItem] = useState<CidItem>(emptyCidItem);
  const [loaded, setLoaded] = useState<boolean>(false);

  const [overrideCid, setOverrideCid] = useState<boolean>(false);
  const [localOverrideCid, setLocalOverrideCid] = useState<boolean>(false);

  // Refs
  const cidInputRef = useRef<HTMLInputElement>();
  const cidUrlInputRef = useRef<HTMLInputElement>();

  useEffect(() => {
    setCidItem(props.cidItem);
    setLoaded(props.isOverrideFilter ? !props.isOverrideFilter : true);
    setIsEdit(props.isEdit);
  }, [props.cidItem, props.isOverrideFilter, props.isEdit]);

  useEffect(() => {
    if (props.isOverrideFilter) {
      ApiService.getCidOverride(props.cidItem.cid, props.filterList)
        .then((res) => {
          setOverrideCid(res.remote);
          setLocalOverrideCid(res.local);
          setLoaded(true);
        })
        .catch((err) => {
          setLoaded(true);
        });
    }
  }, [props.isOverrideFilter, props.cidItem.cid, props.filterList]);

  const enterEdit = (): void => {
    if (cidItem) {
      props.updateCidItem(
        { ...cidItem, edit: true, isChecked: false },
        props.index
      );
    }
  };

  const handleSave = (e: any): void => {
    cidItem.cid = cidInputRef.current?.value ?? "";
    cidItem.refUrl = cidUrlInputRef.current?.value ?? "";
    if (cidItem.cid || cidItem.refUrl) {
      props.saveItem(cidItem, props.index);
    } else {
      props.cancelEdit(cidItem, props.index);
    }
  };

  const handleDelete = (): void => {
    props.prepareModalForDeleteItems([cidItem]);
  };

  const handleMovePress = (): void => {
    props.beginMoveToDifferentFilter([cidItem]);
  };

  const handleCancelEdit = (): void => {
    props.cancelEdit(cidItem, props.index);
  };

  const handleSelectedCid = (): void => {
    props.updateCidItem(
      { ...cidItem, isChecked: !cidItem.isChecked },
      props.index
    );
  };

  const renderOverride = (local = false): JSX.Element => {
    if (!props.isOverrideFilter) {
      // filter is not overrideing
      return <></>;
    }
    if (loaded) {
      if (!local && overrideCid) {
        // override
        return (
          <>
            <OverlayTrigger
              placement="right"
              delay={{ show: 150, hide: 300 }}
              overlay={
                <Tooltip id="button-tooltip">
                  This CID overrides the one in imported filter
                </Tooltip>
              }
            >
              <FontAwesomeIcon icon={faCheck as IconProp} color="#28a745" />
            </OverlayTrigger>
          </>
        );
      }

      if (local && localOverrideCid) {
        return (
          <>
            <OverlayTrigger
              placement="right"
              delay={{ show: 150, hide: 300 }}
              overlay={
                <Tooltip id="button-tooltip">
                  This CID is already in a local filter, please remove the CID
                  from the local filter instead of adding it to an override list
                </Tooltip>
              }
            >
              <FontAwesomeIcon icon={faCheck as IconProp} color="#ffc107" />
            </OverlayTrigger>
          </>
        );
      }
      // dosen't override
      return <></>;
    }
    // loader
    return (
      <>
        <PuffLoader color={"#28a745"} size={20} />
      </>
    );
  };

  const renderCidActions = (): JSX.Element => {
    if (props.isHashedCid) {
      return <></>;
    }

    return (
      <>
        <Row>
          <Col sm={{ span: 3, offset: 0 }} md={3} lg={{ span: 3, offset: 3 }}>
            <Button
              variant="primary"
              className="k-button"
              style={{ minWidth: 74 }}
              onClick={enterEdit}
            >
              Edit
            </Button>
          </Col>
          <Col sm={3} md={3} lg={3}>
            <Button
              variant="secondary"
              className="k-button"
              style={{ minWidth: 74 }}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Col>
          <Col sm={3} md={3} lg={3}>
            {isEdit && (
              <Button
                variant="warning"
                className="k-button"
                style={{ minWidth: 74 }}
                onClick={handleMovePress}
              >
                Move
              </Button>
            )}
          </Col>
        </Row>
      </>
    );
  };

  return (
    <div key={cidItem.tableKey}>
      <ListGroup.Item>
        {cidItem.edit ? (
          <Form inline>
            <Form.Group controlId="cidItemEdit">
              <Form.Label style={{ marginRight: 3 }}>CID:</Form.Label>
              <Form.Control
                ref={(ref) => (cidInputRef.current = ref)}
                type="text"
                placeholder=""
                defaultValue={cidItem.cid}
              />
              <Form.Label style={{ marginRight: 3 }}>URL:</Form.Label>
              <Form.Control
                ref={(ref) => (cidUrlInputRef.current = ref)}
                type="text"
                placeholder=""
                defaultValue={cidItem.refUrl ?? ""}
              />
              <Button className="k-button" onClick={handleSave}>
                Save
              </Button>
              <Button
                className="k-button"
                variant="secondary"
                style={{ marginLeft: 5 }}
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
            </Form.Group>
          </Form>
        ) : (
          <Container>
            <Row>
              <Col sm={2} md={2} lg={1}>
                <Form.Check
                  type="checkbox"
                  checked={cidItem.isChecked}
                  disabled={props.isHashedCid}
                  onChange={handleSelectedCid}
                />
              </Col>
              <Col sm={2} md={2} lg={1}>
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {renderOverride(true)}
                </div>
              </Col>
              <Col sm={2} md={2} lg={1}>
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  {renderOverride()}
                </div>
              </Col>
              <Col sm={8} md={8} lg={4}>
                <Form.Label
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                  }}
                >
                  {FilterService.renderHashedCid(cidItem, false)}
                </Form.Label>
                <Form.Label
                  style={{
                    marginLeft: 10,
                  }}
                >
                  {cidItem.refUrl ? (
                    <a
                      href={cidItem.refUrl}
                      target="_blank"
                      style={{
                        fontSize: 19,
                        fontWeight: "normal",
                        color: "blue",
                      }}
                    >
                      (See complaint)
                    </a>
                  ) : (
                    ""
                  )}
                </Form.Label>
              </Col>
              <Col sm={12} md={12} lg={4}>
                {renderCidActions()}
              </Col>
            </Row>
          </Container>
        )}
      </ListGroup.Item>
    </div>
  );
};

export default CidItemRenderer;

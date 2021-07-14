import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { BaseSyntheticEvent, useState } from "react";
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

const CidItemRender = (props: CidItemProps): JSX.Element => {
  const [cidItem, setCidItem] = useState(props.cidItem);
  const [oldCidItem, setOldCidItem] = useState(cidItem);
  const [edit, setEdit] = useState(false);
  const [loaded, setLoaded] = useState(
    props.isOverrideFilter ? !props.isOverrideFilter : true
  );
  const [overrideCid, setOverrideCid] = useState(false);
  const [localOverrideCid, setLocalOverrideCid] = useState(false);

  const updateItemField = (
    field: string,
    value: string,
    item: CidItem
  ): CidItem => {
    if (field === "cid") {
      item.cid = value;
    }
    return item;
  };
  const enterEdit = (): void => {
    if (cidItem) {
      setEdit(true);
      setOldCidItem({ ...cidItem });
    }
  };

  const handleSave = (e: any): void => {
    props.saveItem(cidItem, props.index);
    setOldCidItem(cidItem);
    setEdit(false);
  };

  const hangleChangeCidValue = (e: BaseSyntheticEvent): void => {
    const cid = e.target.value;
    setCidItem({ ...cidItem, cid });
  };

  const handleDelete = (): void => {
    props.deleteItem(cidItem, props.index);
  };

  const handleMovePress = (): void => {
    props.beginMoveToDifferentFilter(cidItem, props.index);
  };

  const handleCancelEdit = (): void => {
    setCidItem(oldCidItem);
    setEdit(false);
  };

  const checkIfIsOverrideExists = (): void => {
    Promise.all([
      ApiService.getCidOverride(props.cidItem.cid, props.filterList),
      ApiService.getCidOverrideLocal(cidItem.cid, props.filterList),
    ])
      .then((res) => {
        setOverrideCid(!!res[0]);
        setLocalOverrideCid(!!res[1]);
        setLoaded(true);
      })
      .catch((err) => setLoaded(true));
  };

  const renderOverride = (local = false) => {
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
            <Button
              variant="warning"
              className="k-button"
              style={{ minWidth: 74 }}
              onClick={handleMovePress}
            >
              Move
            </Button>
          </Col>
        </Row>
      </>
    );
  };

  return (
    <div key={props.index}>
      <ListGroup.Item>
        {edit ? (
          <Form inline>
            <Form.Group controlId="cidItemEdit">
              <Form.Label style={{ marginRight: 3 }}>CID:</Form.Label>
              <Form.Control
                type="text"
                placeholder=""
                value={cidItem.cid}
                onChange={hangleChangeCidValue}
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
                  {FilterService.renderHashedCid(props.cidItem, false)}
                </Form.Label>
              </Col>
              <Col sm={12} md={12} lg={6}>
                {renderCidActions()}
              </Col>
            </Row>
          </Container>
        )}
      </ListGroup.Item>
    </div>
  );
};

export default CidItemRender;

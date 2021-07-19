import React, { useEffect, useState } from "react";
import { CidItem, CidItemProps } from "./Interfaces";
import {
  Button,
  Col,
  Form,
  ListGroup,
  Container,
  Row,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { RefObject } from "react";
import FilterService from "../../services/FilterService";
import PuffLoader from "react-spinners/PuffLoader";
import ApiService from "../../services/ApiService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

// function validateCid(cid: string): boolean{
//     // :TODO: check length, check allowed characters
//     return true;
// }

export default function CidItemRender(props: CidItemProps) {
  const emptyCidItem: CidItem = {
    tableKey: "",
    cid: "",
    isChecked: false,
  };
  const [cidItem, setCidItem] = useState<CidItem>(emptyCidItem);
  const [cidInputRef, setCidInputRef] = useState<RefObject<HTMLInputElement>>(
    React.createRef<HTMLInputElement>()
  );
  const [loaded, setLoaded] = useState<boolean>(false);
  const [isOverrideFilter, setIsOverrideFilter] = useState<boolean>(false);
  const [overrideCid, setOverrideCid] = useState<boolean>(false);
  const [localOverrideCid, setLocalOverrideCid] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);

  const checkIfIsOverrideExists = (): void => {
    Promise.all([
      ApiService.getCidOverride(props.cidItem.cid, props.filterList),
      ApiService.getCidOverrideLocal(props.cidItem.cid, props.filterList),
    ])
      .then((res) => {
        setOverrideCid(!!res[0]);
        setLocalOverrideCid(!!res[1]);
        setLoaded(true);
      })
      .catch((err) => {
        setLoaded(true);
      });
  };

  useEffect(() => {
    setCidItem(props.cidItem);
    setLoaded(props.isOverrideFilter ? !props.isOverrideFilter : true);
    setIsOverrideFilter(props.isOverrideFilter ? props.isOverrideFilter : true);
    setIsEdit(props.isEdit);
  });

  useEffect(() => {
    if (props.isOverrideFilter) {
      checkIfIsOverrideExists();
    }
  }, []);

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
    if (cidItem != null) {
      cidItem.edit = true;
      cidItem.isChecked = false;
    }
    props.updateCidItem(cidItem, props.index);
  };

  const handleSave = (e: any): void => {
    // e.preventDefault();
    const ref = cidInputRef.current;
    const value = ref !== null ? ref.value : null;
    let updatedItem: CidItem = { ...cidItem };
    if (value !== null) {
      updatedItem = updateItemField("cid", value, updatedItem);
      setCidItem({ ...updatedItem, edit: false });
      props.saveItem(updatedItem, props.index);
    }
  };

  const hangleChangeCidValue = (e: any): void => {
    const ref = cidInputRef.current;
    const value = ref !== null ? ref.value : null;
    let updatedItem: CidItem = { ...cidItem };
    if (value !== null) {
      updatedItem = updateItemField("cid", value, updatedItem);
      // setCidItem({ ...updatedItem, edit: false });
      props.changeCidValue(updatedItem, props.index);
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
    cidItem.isChecked = !cidItem.isChecked;
    props.updateCidItem(cidItem, props.index);
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
                ref={cidInputRef}
                type="text"
                placeholder=""
                defaultValue={cidItem.cid}
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
                <Form.Check
                  type="checkbox"
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
}

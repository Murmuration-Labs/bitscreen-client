import * as React from "react";
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

export default class CidItemRender extends React.Component<
  CidItemProps,
  {
    item: CidItem;
    cidInputRef: RefObject<HTMLInputElement>;
    loaded: boolean;
    isOverrideFilter: boolean;
    overrideCid: boolean;
    localOverrideCid: boolean;
    isEdit: boolean;
  }
> {
  constructor(props: CidItemProps) {
    super(props);
    this.state = {
      item: this.props.cidItem,
      cidInputRef: React.createRef<HTMLInputElement>(),
      loaded: this.props.isOverrideFilter ? !this.props.isOverrideFilter : true,
      isOverrideFilter: this.props.isOverrideFilter
        ? this.props.isOverrideFilter
        : true,
      overrideCid: false,
      localOverrideCid: false,
      isEdit: this.props.isEdit,
    };

    if (this.props.isOverrideFilter) {
      this.checkIfIsOverrideExists();
    }
  }

  static updateItemField(field: string, value: string, item: CidItem): CidItem {
    if (field === "cid") {
      item.cid = value;
    }
    return item;
  }
  enterEdit = (): void => {
    if (this.state.item != null) {
      this.state.item.edit = true;
      this.state.item.isChecked = false;
    }
    this.props.updateCidItem(this.state.item);
  };
  handleSave = (e: any): void => {
    // e.preventDefault();
    const ref = this.state.cidInputRef.current;
    const value = ref !== null ? ref.value : null;
    let updatedItem: CidItem = { ...this.state.item };
    if (value !== null) {
      updatedItem = CidItemRender.updateItemField("cid", value, updatedItem);
      this.setState({ item: { ...updatedItem, edit: false } });
      this.props.saveItem(updatedItem);
    }
  };

  hangleChangeCidValue = (e: any): void => {
    const ref = this.state.cidInputRef.current;
    const value = ref !== null ? ref.value : null;
    let updatedItem: CidItem = { ...this.state.item };
    if (value !== null) {
      updatedItem = CidItemRender.updateItemField("cid", value, updatedItem);
      // this.setState({ item: { ...updatedItem, edit: false } });
      this.props.changeCidValue(updatedItem);
    }
  };

  handleDelete = (): void => {
    this.props.deleteItem(this.state.item);
  };

  handleMovePress = (): void => {
    this.props.beginMoveToDifferentFilter([this.state.item]);
  };

  handleCancelEdit = (): void => {
    this.props.cancelEdit(this.state.item, this.props.index);
  };

  handleSelectedCid = (): void => {
    this.state.item.isChecked = !this.state.item.isChecked;
    this.props.updateCidItem(this.state.item);
  };

  checkIfIsOverrideExists = (): void => {
    Promise.all([
      ApiService.getCidOverride(this.props.cidItem.cid, this.props.filterList),
      ApiService.getCidOverrideLocal(
        this.props.cidItem.cid,
        this.props.filterList
      ),
    ])
      .then((res) => {
        this.setState({
          ...this.state,
          overrideCid: !!res[0],
          localOverrideCid: !!res[1],
          loaded: true,
        });
      })
      .catch((err) => {
        this.setState({
          ...this.state,
          loaded: true,
        });
      });
  };

  renderOverride(local = false): JSX.Element {
    if (!this.props.isOverrideFilter) {
      // filter is not overrideing
      return <></>;
    }
    if (this.state.loaded) {
      if (!local && this.state.overrideCid) {
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

      if (local && this.state.localOverrideCid) {
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
  }
  renderCidActions(): JSX.Element {
    if (this.props.isHashedCid) {
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
              onClick={this.enterEdit}
            >
              Edit
            </Button>
          </Col>
          <Col sm={3} md={3} lg={3}>
            <Button
              variant="secondary"
              className="k-button"
              style={{ minWidth: 74 }}
              onClick={this.handleDelete}
            >
              Delete
            </Button>
          </Col>
          <Col sm={3} md={3} lg={3}>
            {this.state.isEdit && (
              <Button
                variant="warning"
                className="k-button"
                style={{ minWidth: 74 }}
                onClick={this.handleMovePress}
              >
                Move
              </Button>
            )}
          </Col>
        </Row>
      </>
    );
  }
  render(): JSX.Element {
    return (
      <div key={this.state.item.cid}>
        <ListGroup.Item>
          {this.state.item.edit ? (
            <Form inline>
              <Form.Group controlId="cidItemEdit">
                <Form.Label style={{ marginRight: 3 }}>CID:</Form.Label>
                <Form.Control
                  ref={this.state.cidInputRef}
                  type="text"
                  placeholder=""
                  defaultValue={this.state.item.cid}
                  onChange={this.hangleChangeCidValue}
                />
                <Button className="k-button" onClick={this.handleSave}>
                  Save
                </Button>
                <Button
                  className="k-button"
                  variant="secondary"
                  style={{ marginLeft: 5 }}
                  onClick={this.handleCancelEdit}
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
                    disabled={this.props.isHashedCid}
                    onChange={this.handleSelectedCid}
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
                    {this.renderOverride(true)}
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
                    {this.renderOverride()}
                  </div>
                </Col>
                <Col sm={8} md={8} lg={4}>
                  <Form.Label
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                    }}
                  >
                    {FilterService.renderHashedCid(this.state.item.cid, false)}
                  </Form.Label>
                </Col>
                <Col sm={12} md={12} lg={4}>
                  {this.renderCidActions()}
                </Col>
              </Row>
            </Container>
          )}
        </ListGroup.Item>
      </div>
    );
  }
}

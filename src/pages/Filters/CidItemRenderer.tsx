import * as React from "react";
import { CidItem, CidItemProps } from "./Interfaces";
import { Button, Col, Form, ListGroup, Container, Row } from "react-bootstrap";
import { RefObject } from "react";
import FilterService from "../../services/FilterService";

// function validateCid(cid: string): boolean{
//     // :TODO: check length, check allowed characters
//     return true;
// }

export default class CidItemRender extends React.Component<
  CidItemProps,
  { item: CidItem; cidInputRef: RefObject<HTMLInputElement> }
> {
  constructor(props: CidItemProps) {
    super(props);
    this.state = {
      item: this.props.cidItem,
      cidInputRef: React.createRef<HTMLInputElement>(),
    };

    console.info("cidItemRenderer" + this.props.cidItem.cid);
  }

  static updateItemField(field: string, value: string, item: CidItem): CidItem {
    if (field === "cid") {
      item.cid = value;
    }
    return item;
  }
  enterEdit = (): void => {
    console.info("enterEdit");
    if (this.state.item != null) {
      console.info("enterEdit" + this.state.item.edit.toString());
      this.setState({ item: { ...this.state.item, edit: true } });
    }
  };
  cancelEdit = (): void => {
    this.setState({ item: { ...this.props.cidItem, edit: false } });
  };
  handleSave = (e: any): void => {
    // e.preventDefault();
    const ref = this.state.cidInputRef.current;
    const value = ref !== null ? ref.value : null;
    console.info("handleSave: input value is ", value);
    let updatedItem: CidItem = { ...this.state.item };
    if (value !== null) {
      updatedItem = CidItemRender.updateItemField("cid", value, updatedItem);
      this.setState({ item: { ...updatedItem, edit: false } });
      this.props.saveItem(updatedItem);
    }
  };
  handleDelete = (): void => {
    console.info("handleDelete");
    this.props.deleteItem(this.state.item);
  };

  handleMovePress = (): void => {
    this.props.beginMoveToDifferentFilter(this.state.item);
  };

  renderCidActions(): JSX.Element {
    if (this.props.isHashedCid) {
      return <></>;
    }

    return (
      <>
        <Col sm={2} md={2} lg={{ span: 1, offset: 12 }}>
          <Button
            variant="primary"
            className="k-button"
            style={{ marginRight: 5 }}
            onClick={this.enterEdit}
          >
            Edit
          </Button>
        </Col>
        <Col sm={2} md={2} lg={{ span: 1, offset: 16 }}>
          <Button
            variant="secondary"
            className="k-button"
            onClick={this.handleDelete}
          >
            Delete
          </Button>
        </Col>
        <Col sm={2} md={2} lg={{ span: 1, offset: 20 }}>
          <Button
            variant="warning"
            className="k-button"
            onClick={this.handleMovePress}
          >
            Move
          </Button>
        </Col>
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
                  id={"cid_value_" + this.props.index}
                  type="text"
                  placeholder=""
                  defaultValue={this.state.item.cid}
                />
                <Button
                  className="k-button"
                  style={{ marginRight: 5 }}
                  variant="primary"
                  type="submit"
                  onClick={this.handleSave}
                >
                  Save
                </Button>
                <Button className="k-button" onClick={this.cancelEdit}>
                  Cancel
                </Button>
              </Form.Group>
            </Form>
          ) : (
            <Container>
              <Row sm={8} md={12} lg={16}>
                <Col sm={5} md={8} lg={14}>
                  <Form.Label
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      marginRight: 5,
                    }}
                  >
                    {FilterService.renderHashedCid(this.state.item.cid, false)}
                  </Form.Label>
                </Col>
                {this.renderCidActions()}
              </Row>
            </Container>
          )}
        </ListGroup.Item>
      </div>
    );
  }
}

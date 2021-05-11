import React, { Component } from "react";
import { Button, Col, Form, Modal } from "react-bootstrap";
import {
  CidItem,
  FilterState,
  ModalProps,
  Visibility,
  VisibilityString,
} from "./Interfaces";
import CidList from "./CidList";

const newEditState = true;

export default class CustomFilterModal extends Component<
  ModalProps,
  FilterState
> {
  constructor(props: ModalProps) {
    super(props);
    console.info("customFilterModal: " + props.filterList.cids.length);
    const cids = this.props.filterList.cids.map((cid: string) => {
      return { cid, edit: false };
    });
    this.state = {
      data: cids.length === 0 ? [{ cid: "", edit: newEditState }] : cids,
      filterList: { ...this.props.filterList },
    };
  }

  componentDidMount(): void {
    console.info("customFilterModal: " + this.props.filterList.cids.length);
    this.setState({
      data: this.props.filterList.cids.map((cid: string) => {
        return { cid, edit: false };
      }),
      filterList: { ...this.props.filterList },
    });
  }

  mapVisibilityString = (visibilityStr: string): Visibility => {
    if (visibilityStr === "Private") return Visibility.Private;
    if (visibilityStr === "Public") return Visibility.Public;
    if (visibilityStr === "ThirdParty") return Visibility.ThirdParty;

    return Visibility.None;
  };

  saveData = (editItem: CidItem): void => {
    this.setState({
      data: this.state.data.map((e: CidItem) => {
        return e.cid === editItem.cid ? { ...editItem, edit: false } : e;
      }),
    });
    this.setState({
      filterList: {
        ...this.props.filterList,
        cids: this.state.data.map((e: CidItem) => e.cid),
      },
    });
    this.props.dataChanged(this.state.filterList);
  };

  changeName = (event: React.ChangeEvent<HTMLInputElement>): void => {
    event.preventDefault();
    this.setState({
      filterList: { ...this.props.filterList, name: event.target.value },
    });
    this.props.dataChanged(this.state.filterList);
  };

  changeVisibility = (event: React.ChangeEvent<HTMLInputElement>): void => {
    event.preventDefault();
    this.setState({
      filterList: {
        ...this.props.filterList,
        visibility: this.mapVisibilityString(event.target.value),
      },
    });
    this.props.dataChanged(this.state.filterList);
  };

  deleteItem = (editItem: CidItem): void => {
    this.setState({
      data: this.state.data.filter((e: CidItem) => e.cid !== editItem.cid),
    });
    this.setState({
      filterList: {
        ...this.props.filterList,
        cids: this.state.data.map((e: CidItem) => e.cid),
      },
    });
    this.props.dataChanged(this.state.filterList);
  };

  onNewCid = (): void => {
    const d = this.state.data;
    d.push({ cid: "", edit: newEditState });
    this.setState({
      data: d,
    });
    this.setState({
      filterList: {
        ...this.props.filterList,
        cids: this.state.data.map((e: CidItem) => e.cid),
      },
    });
    this.props.dataChanged(this.state.filterList);
  };

  // cidItem = (props: any) => <CidItemRenderer {...props} saveItem={this.saveData} deleteItem={this.deleteItem} />

  render(): JSX.Element {
    return (
      <div>
        <Modal
          show={this.props.show}
          onHide={this.props.handleClose}
          centered={true}
          size="lg"
          onEntered={this.props.modalEntered}
          onShow={() => {
            return;
          }}
        >
          <Modal.Header closeButton>
            <Modal.Title>{this.props.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Row>
                <Col>
                  <Form.Control
                    onChange={this.changeName}
                    type="text"
                    placeholder="List Name"
                    value={this.props.filterList.name}
                  />
                </Col>
              </Form.Row>
              <Form.Row>
                <Col xs={"auto"}>
                  <Form.Group controlId="visibility">
                    <Form.Control
                      as="select"
                      onChange={this.changeVisibility}
                      value={VisibilityString[this.props.filterList.visibility]}
                    >
                      <option>Public</option>
                      <option>Private</option>
                    </Form.Control>
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Label className={"text-dim"}>
                    Shared lists will be accessible to other nodes if they have
                    imported the shareable URL.
                  </Form.Label>
                </Col>
              </Form.Row>
              <Form.Row>
                <Col>
                  <Button className="btn-light" onClick={this.onNewCid}>
                    + new CID
                  </Button>

                  <CidList
                    {...{
                      cids: this.state.data,
                      saveItem: this.saveData,
                      deleteItem: this.deleteItem,
                    }}
                  />
                </Col>
              </Form.Row>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={this.props.handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={this.props.save}>
              Save
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

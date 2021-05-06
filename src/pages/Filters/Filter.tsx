import React, {Component} from "react";
import {Button, Col, Form, Modal} from "react-bootstrap";
import {CidItem, ModalProps} from "./Interfaces";
import CidList from "./CidList";

const newEditState = false;

export default class CustomFilterModal extends Component<ModalProps, any> {

    constructor(props: ModalProps) {
        super(props);
        console.info("customFilterModal: " + props.cids.length)
        const cids = this.props.cids.map((cid: string) => {
            return {cid, edit: false}
        })
        this.state = {
            data: cids.length === 0 ? [{cid: "", edit: newEditState}] : cids
        };
    }

    componentDidMount(){
        console.info("customFilterModal: " + this.props.cids.length)
        this.setState({
            data: this.props.cids.map((cid: string) => {
                return {cid, edit: false}
            })
        });
    }

    saveData = (editItem: CidItem) => {
        this.setState({
            data: this.state.data.map((e: CidItem) => {
                return e.cid === editItem.cid ? {...editItem, edit: false} : e
            })
        });

    }

    deleteItem  = (editItem: CidItem) => {
        this.setState({
            data: this.state.data.filter((e: CidItem) => e.cid !== editItem.cid)
        });
    }

    onNewCid = () => {
        this.state.data.push({cid: "", edit: newEditState});
        this.setState({
            data: this.state.data
        });
    }

    // cidItem = (props: any) => <CidItemRenderer {...props} saveItem={this.saveData} deleteItem={this.deleteItem} />

    render() {
        return (
            <div>
                <Modal show={this.props.show} onHide={this.props.handleClose} centered={true} size="lg"
                       onEntered={this.props.modalEntered}
                       onShow={() => {}} >
                    <Modal.Header closeButton>
                        <Modal.Title>{this.props.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Row>
                                <Col>
                                    <Form.Control
                                        onChange={this.props.changeName}
                                        type="text"
                                        placeholder="List Name"
                                        value={this.props.name}
                                    />
                                </Col>
                            </Form.Row>
                            <Form.Row>
                                <Col xs={"auto"}>
                                    <Form.Group controlId="visibility">
                                        <Form.Control as="select" onChange={this.props.changeVisibility}
                                                      value={this.props.visibility}
                                        >
                                            <option>Public</option>
                                            <option>Private</option>
                                        </Form.Control>
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Label className={"text-dim"}>
                                        Shared lists will be accessible to other nodes if
                                        they have imported the shareable URL.
                                    </Form.Label>
                                </Col>
                            </Form.Row>
                            <Form.Row>
                                <Col>
                                    <Button className="btn-light" onClick={this.onNewCid}>
                                        + new CID
                                    </Button>

                                    <CidList {...{
                                        cids: this.state.data,
                                        saveItem: this.saveData,
                                        deleteItem: this.deleteItem}}/>
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
        )
    }
}


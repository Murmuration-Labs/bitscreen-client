import React, { Component, useEffect, useState } from "react";
import { RouterProps } from "../App";
import {Button, Col, Container, Form, FormCheck, Modal, Row} from "react-bootstrap";
import "./Filters.css";
import keccak256 from "keccak256";
import { serverUri } from "../../config";

enum Visibility {
  None,
  Private,
  Shared,
  ThirdParty,
}

const VisibilityString: string[] = ["", "Private", "Shared", "ThirdParty"]

interface FilterList {
  _id?: number,
  name: string;
  cidHashes: string[];
  visibility: Visibility;
  enabled: boolean;
}

interface ModalProps {
  name: string;
  cids: string[];
  show: boolean;
  enabled: boolean;
  handleClose: () => void;
  modalEntered: () => void;
  title: string;
  changeName: (e: React.ChangeEvent<HTMLInputElement>) => void;
  changeVisibility: (e: React.ChangeEvent<HTMLInputElement>) => void;
  changeEnabled: (e: React.ChangeEvent<HTMLInputElement>) => void;
  visibility: string;
  cidsChanged: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  save: () => void
}

class CustomFilterModal extends Component<ModalProps, any> {

  constructor(props: any) {
    super(props);
  }

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
                        <option>Shared</option>
                        <option>Private</option>
                      </Form.Control>
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Label className={"text-dim"}>
                      Filtered CIDs on shared lists will be accessible to other
                      nodes.
                    </Form.Label>
                  </Col>
                </Form.Row>
                <Form.Row>
                  <Col xs={'auto'}>
                    <Form.Group controlId={"enabled"}>
                      <FormCheck
                          type="switch"
                          id="enabled"
                          label="Is this filter enabled?"
                          checked={this.props.enabled}
                          onChange={this.props.changeEnabled}
                      />
                    </Form.Group>
                  </Col>
                </Form.Row>
                <Form.Row>
                  <Col>
                    <Form.Control
                        onChange={this.props.cidsChanged}
                        as="textarea"
                        rows={10}
                        value={this.props.cids.join("\n")}
                    />
                    <Form.Label className={"text-dim"}>
                      One CID per line. (Optional: use CID, URL to link to
                      public record of complaint)
                    </Form.Label>
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

function Filters({ match }: RouterProps) {
  const [filterLists, setFilterLists] = useState<FilterList[]>([]);

  const [ visibility, setVisibility ] = useState<string>(VisibilityString[Visibility.Private]);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [showEdit, setShowEdit] = useState<boolean>(false);

  const handleCloseEdit = () => setShowEdit(false);
  const handleCloseAdd = () => setShowAdd(false);
  const handleShowAdd = () => {
    setName("");
    setVisibility(VisibilityString[Visibility.Private]);
    setCids([]);
    setShowAdd(true);
  }

  const [showImport, setShowImport] = useState(false);
  const handleCloseImport = () => setShowImport(false);
  const handleShowImport = () => setShowImport(true);

  const [id, setId] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [cidHashes, setCidHashes] = useState<string[]>([]);
  const [cids, setCids] = useState<string[]>([]);
  const [enabled, setEnabled] = useState<boolean>(true);

  const CIDFilter = (props: FilterList) => {
    return (
        <div>
          <a href={"#"} onClick={(e) => {showEditModal(props)}}>{props.name}</a>
          <span className={"ml-1 text-dim"}>
          [{translateVisibility(props.visibility)}:
            {props.cidHashes.length} items]
        </span>
        </div>
    );
  }

  const getFilters = async () => {
    const filters = await fetch(`${serverUri()}/filters`);

    const filterLists: FilterList[] = await filters.json();

    setFilterLists(filterLists);
    setLoaded(true);
  };

  useEffect(() => {
    void getFilters();
  }, []);

  const putFilters = async () => {
    const filterList: FilterList = {
      _id: id,
      name,
      cidHashes: cidHashes,
      visibility: mapVisibilityString(visibility),
      enabled: enabled
    }

    console.log(filterList)

    const existing = await fetch(`${serverUri()}/filters`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filterList),
    });
  };

  const postFilters = async () => {
    const newFilterList: FilterList = {
      name,
      cidHashes,
      visibility: mapVisibilityString(visibility),
      enabled
    };

    const newId = await fetch(`${serverUri()}/filters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newFilterList),
    });
  };

  const showEditModal = (filterList: FilterList) => {
    if (filterList._id) {
      setId(filterList._id);
    }

    setCidHashes(filterList.cidHashes);

    setName(filterList.name);
    setVisibility(VisibilityString[filterList.visibility]);
    setCids(filterList.cidHashes);
    setShowEdit(true);
    setEnabled(filterList.enabled);
  }

  const saveFilter = () => {
    handleCloseEdit();

    putFilters().then(async () => {
      await getFilters();

      // be kind rewind
      setId(0);
      setName("");
      setCidHashes([]);
      setCids([])
      setEnabled(true)
    });
  }
  const addFilter = () => {
    handleCloseAdd();

    postFilters().then(async () => {
      await getFilters();

      // be kind rewind
      setId(0);
      setName("");
      setCidHashes([]);
      setCids([])
      setEnabled(true)
    });
  };

  const importFilter = () => {
    handleCloseImport();

    // todo: implement

    console.log("filter imported");
  };

  const modalEntered = () => {

  }
  const changeName = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setName(event.target.value);
  };

  const changeEnabled = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEnabled(!enabled);
  };

  const changeVisibility = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setVisibility(event.target.value);
  }

  const cidsChanged = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const cids = event.target.value.split("\n");
    setCids(cids)
    // console.log(cidHashes);
    const _cidHashes: string[] = cids.filter(function(value){return value}).map((cid) => {
          return keccak256(Buffer.from(cid)).toString("hex");
        }
    );

    setCidHashes(_cidHashes);
  };

  const mapVisibilityString = (visibilityStr: string): Visibility => {
    if (visibilityStr === "Private") return Visibility.Private
    if (visibilityStr === "Shared") return Visibility.Shared
    if (visibilityStr === "ThirdParty") return Visibility.ThirdParty

    return Visibility.None
  }

  const translateVisibility = (visibility: Visibility): string => {
    return VisibilityString[visibility]
  };

  return (
    <>
      {loaded ? (
        <>
          <Container>
            <h2>Filters</h2>
            <Row>
              <Col>
                <Form inline>
                  <Form.Group controlId="search">
                    <Form.Control type="text" placeholder="Search CID" />
                    <Form.Control as="select">
                      <option>CID</option>
                    </Form.Control>
                    <Button>Submit</Button>
                  </Form.Group>
                </Form>
              </Col>
              <Col className="text-right">
                <Button className="btn-light" onClick={handleShowAdd}>
                  + new Filter
                </Button>
                <Button className="btn-light" onClick={handleShowImport}>
                  Import Filter
                </Button>
              </Col>
            </Row>

            <Row>
              <Col>
                {filterLists.map((fl, i) => (
                  <div className={"mt-1"} key={`${fl.name}-${i}`}>
                    <CIDFilter {...fl}/>
                  </div>
                ))}
              </Col>
            </Row>
          </Container>

          <CustomFilterModal {...{
            show: showEdit, visibility, cids: cids, enabled: enabled,
            handleClose: handleCloseEdit, name,
            changeName, save: saveFilter,
            title: "Edit filter", changeVisibility, cidsChanged,
            modalEntered, changeEnabled
          }}/>

          <CustomFilterModal {...{
            show: showAdd, visibility, cids, enabled,
            handleClose: handleCloseAdd, name,
            changeName, save: addFilter,
            title: "New custom filter", changeVisibility, cidsChanged,
            modalEntered, changeEnabled
          }}/>

          <Modal show={showImport} onHide={handleCloseImport} centered={true}>
            <Modal.Header closeButton>
              <Modal.Title>Import Filter</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Row>
                  <Col>
                    <Form.Control type="text" placeholder="Share Link URL" />
                    <Form.Label className={"text-dim"}>
                      Input a URL to run a filter made by a 3rd party.
                    </Form.Label>
                  </Col>
                </Form.Row>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseImport}>
                Close
              </Button>
              <Button variant="primary" onClick={importFilter}>
                Import
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      ) : null}
    </>
  );
}

export default Filters;

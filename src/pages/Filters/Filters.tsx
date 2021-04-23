import React, { Component, useEffect, useState } from "react";
import { RouterProps } from "../App";
import { Button, Col, Container, Form, Modal, Row } from "react-bootstrap";
import "./Filters.css";
import keccak256 from "keccak256";

enum Visibility {
  None,
  Private,
  Shared,
  ThirdParty,
}

interface FilterList {
  name: string;
  cidHashes: string[];
  visibility: Visibility;
}

interface ModalProps {

}

class MyModalComponent extends Component {
  name: string = "";
  cids: string[];

  constructor(props: any, context: any) {
    super(props, context);
    this.name = this.props.name;
    this.cids = [];
  }

  render() {
    return (
        <div>
          <Modal show={this.props.show} onHide={this.props.handleClose} centered={true} size="lg"
                 onShow={() => {}} >
            <Modal.Header closeButton>
              <Modal.Title>{this.props.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Row>
                  <Col>
                    <Form.Control
                        // onChange={props.changeName}
                        type="text"
                        placeholder="List Name"
                        value={this.name}
                    />
                  </Col>
                </Form.Row>
                <Form.Row>
                  <Col xs={"auto"}>
                    <Form.Group controlId="visibility">
                      <Form.Control as="select" onChange={this.props.changeVisibility} value={this.props.visibility}>
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
                  <Col>
                    <Form.Control
                        onChange={this.props.cidsChanged}
                        as="textarea"
                        rows={10}
                        value={this.cids.join("\n")}
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

  const [ visibility, setVisibility ] = useState<Visibility>(Visibility.Private);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [showEdit, setShowEdit] = useState<boolean>(false);

  const handleCloseEdit = () => setShowEdit(false);
  const handleCloseAdd = () => setShowAdd(false);
  const handleShowAdd = () => setShowAdd(true);

  const [showImport, setShowImport] = useState(false);
  const handleCloseImport = () => setShowImport(false);
  const handleShowImport = () => setShowImport(true);

  const [name, setName] = useState<string>("");
  const [cidHashes, setCidHashes] = useState<string[]>([]);

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
    const filters = await fetch(
      "http://localhost:8080/filters"
    ).then((response) => response.text());

    const lists = filters.split("\n\n");

    const filterLists: FilterList[] = [];

    for (const list of lists) {
      const entries = list.split("\n");

      const title = entries.splice(0, 1)[0];
      if (!title.startsWith("#")) continue;
      const name = title.replace("#", "");
      filterLists.push({
        name,
        cidHashes: entries,
        visibility: Visibility.None,
      });
    }

    setFilterLists(filterLists);
    setLoaded(true);
  };

  useEffect(() => {
    void getFilters();
  }, []);

  useEffect(() => {
    console.log("putting filters change");
    void putFilters();
  }, [filterLists]);

  const putFilters = async () => {
    if (filterLists.length === 0) return;

    const filtersString: string = filterLists
      .map((fl) => [`#${fl.name}`, ...fl.cidHashes].join("\n"))
      .join("\n\n");

    console.log("putting filters", filterLists, `"${filtersString}"`);

    await fetch("http://localhost:8080/filters", {
      method: "PUT",
      headers: {
        "Content-Type": "text/plain",
      },
      body: filtersString,
    });

    console.log("filters set", filtersString);
  };

  const showEditModal = (filterList: FilterList) => {
    setName(filterList.name);
    setVisibility(filterList.visibility);
    // setCidHashes(filterList.cidHashes);
    // tempCIDs = filterList.cidHashes;
    setShowEdit(true);
  }

  const saveFilter = () => {
    handleCloseEdit();

    const filterList: FilterList = {
      name,
      cidHashes,
      visibility: visibility,
    };

    // be kind rewind
    setName("");
    setCidHashes([]);

    setFilterLists([...filterLists, filterList]);
    console.log("filter saved");
  }
  const addFilter = () => {
    handleCloseAdd();

    const filterList: FilterList = {
      name,
      cidHashes,
      visibility: Visibility.Private,
    };

    // be kind rewind
    setName("");
    setCidHashes([]);

    setFilterLists([...filterLists, filterList]);
    console.log("filter added");
  };

  const importFilter = () => {
    handleCloseImport();

    // todo: implement

    console.log("filter imported");
  };

  const changeName = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setName(event.target.value);
  };

  const changeVisibility = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setName(event.target.value);
  }
  const cidsChanged = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const cids = event.target.value.split("\n").filter(function(value){return value});
    console.log(cids);
    console.log(cidHashes);
    // if (cids.join(",") == cidHashes.join(",")) {
    //   setCidHashes(cids);
    //   return
    // }

    const _cidHashes: string[] = cids.map((cid) => {
          return keccak256(Buffer.from(cid)).toString("hex");
        }
    );

    setCidHashes(_cidHashes);
    console.log(_cidHashes);
  };

  const translateVisibility = (visibility: Visibility): string => {
    let result = "";

    switch (visibility) {
      case Visibility.Private:
        result = "Private";
        break;
      case Visibility.Shared:
        result = "Shared";
        break;
      case Visibility.ThirdParty:
        result = "3rd Party";
        break;
    }

    return result;
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

          <MyModalComponent {...{
            show: showEdit, visibility,
            handleClose: handleCloseEdit, name,
            changeName, save: saveFilter,
            title: "Edit filter", changeVisibility
          }}/>

          <Modal show={showAdd} onHide={handleCloseAdd} centered={true}>
            <Modal.Header closeButton>
              <Modal.Title>New Custom Filter</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Row>
                  <Col>
                    <Form.Control
                        onChange={changeName}
                        type="text"
                        placeholder="List Name"
                    />
                  </Col>
                </Form.Row>
                <Form.Row>
                  <Col xs={"auto"}>
                    <Form.Group controlId="visibility">
                      <Form.Control as="select" onChange={changeVisibility}>
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
                  <Col>
                    <Form.Control
                        onChange={cidsChanged}
                        as="textarea"
                        rows={5}
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
              <Button variant="secondary" onClick={handleCloseAdd}>
                Close
              </Button>
              <Button variant="primary" onClick={addFilter}>
                Save
              </Button>
            </Modal.Footer>
          </Modal>

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

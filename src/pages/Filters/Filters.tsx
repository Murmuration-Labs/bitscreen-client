import React, { useEffect, useState } from "react";
import { RouterProps } from "../App";
import { Button, Col, Container, Form, Modal, Row } from "react-bootstrap";
import "./Filters.css";
import { serverUri } from "../../config";
import CustomFilterModal from "./Filter";
import {VisibilityString, Visibility, FilterList, CidItem} from "./Interfaces";

function Filters({ match }: RouterProps) {
  const [filterLists, setFilterLists] = useState<FilterList[]>([]);
  const [filtersCache, setFiltersCache] = useState<string>("");

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

  const [name, setName] = useState<string>("");
  const [cids, setCids] = useState<string[]>([]);

  const CIDFilter = (props: FilterList) => {
    return (
        <div>
          <a onClick={(e) => {showEditModal(props)}}>{props.name}</a>
          <span className={"ml-1 text-dim"}>
          [{translateVisibility(props.visibility)}:
            {props.cids.length} items]
        </span>
        </div>
    );
  }

  const getFilters = async () => {
    const filters = await fetch(
        `${serverUri()}/filters`
    ).then((response) => response.text());

    const lists = filters === "" ? "[]": JSON.parse(filters);
    const filterLists: FilterList[] = [];

    for (const fl of lists) {
      if (fl.name != null) {
        filterLists.push({
          name: fl.name,
          cids: fl.cids,
          visibility: mapVisibilityString(fl.visibility),
          enabled: fl.enabled
        });
      }
    }

    setFilterLists(filterLists);
    setFiltersCache(JSON.stringify(filterLists))
    console.log("filters loaded", JSON.stringify(filterLists));
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
    if (JSON.stringify(filterLists) === filtersCache) return;

    const filters: {}[]  = filterLists
        .filter((fl) => fl.name !== null)
        .map((fl) => {
        return {name: fl.name, cids: fl.cids, visibility: fl.visibility}
      })

    const filtersString = JSON.stringify(filters)
    console.log("putting filters", filterLists, `"${filtersString}"`);

    await fetch(`${serverUri()}/filters`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: filtersString,
    });
    setFiltersCache(JSON.stringify(filterLists))
    console.log("filters set", filtersString);
  };

  const showEditModal = (filterList: FilterList) => {
    setName(filterList.name);
    setVisibility(VisibilityString[filterList.visibility]);
    setCids(filterList.cids);
    setShowEdit(true);
    console.log("showEditModal " + name + cids + filterList.name + filterList.cids);

  }

  const saveFilter = () => {
    handleCloseEdit();

    const filterList: FilterList = {
      name,
      cids,
      visibility: mapVisibilityString(visibility),
      enabled: true
    };

    // be kind rewind
    setName("");
    setCids([]);

    setFilterLists([...filterLists, filterList]);
    console.log("filter saved " + name + cids);
  }
  const addFilter = () => {
    handleCloseAdd();

    const filterList: FilterList = {
      name,
      cids,
      visibility: mapVisibilityString(visibility),
      enabled: true
    };

    // be kind rewind
    setName("");
    setCids([]);

    setFilterLists([...filterLists, filterList]);
    console.log("filter added " + name + cids);
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

  const changeVisibility = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    setVisibility(event.target.value);
  }

  const cidsChanged = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    const cids = event.target.value.split("\n");
    setCids(cids)
    console.log(cids);
  };

  const mapVisibilityString = (visibilityStr: string): Visibility => {
    if (visibilityStr === "Private") return Visibility.Private
    if (visibilityStr === "Public") return Visibility.Public
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
                    <Button>Search</Button>
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
            show: showEdit, visibility, cids,
            handleClose: handleCloseEdit, name,
            changeName, save: saveFilter,
            title: "Edit filter", changeVisibility, cidsChanged,
            modalEntered
          }}/>

          <CustomFilterModal {...{
            show: showAdd, visibility, cids,
            handleClose: handleCloseAdd, name,
            changeName, save: addFilter,
            title: "New custom filter", changeVisibility, cidsChanged,
            modalEntered
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

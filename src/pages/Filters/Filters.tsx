import React, { useEffect, useState } from "react";
import { Button, Col, Container, Form, Modal, Row } from "react-bootstrap";
import "./Filters.css";
import { serverUri } from "../../config";
import CustomFilterModal from "./Filter";
import { FilterList, Visibility, VisibilityString } from "./Interfaces";

function Filters(): JSX.Element {
  const emptyFilterList = () => {
    return {
      _id: 0,
      name: "",
      cids: [],
      visibility: Visibility.Private,
      enabled: true,
    };
  };

  const [filterLists, setFilterLists] = useState<FilterList[]>([]);
  const [filtersCache, setFiltersCache] = useState<string>("");

  const [loaded, setLoaded] = useState<boolean>(false);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [showEdit, setShowEdit] = useState<boolean>(false);
  const [showImport, setShowImport] = useState(false);

  const [currentFilterList, setCurrentFilterList] = useState<FilterList>(
    emptyFilterList()
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [id, setId] = useState<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [name, setName] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cids, setCids] = useState<string[]>([]);
  const [enabled, setEnabled] = useState<boolean>(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [visibility, setVisibility] = useState<string>(
    VisibilityString[Visibility.Private]
  );

  const handleShowImport = () => setShowImport(true);
  const handleCloseImport = () => setShowImport(false);
  const handleCloseEdit = () => setShowEdit(false);
  const handleCloseAdd = () => setShowAdd(false);

  const handleShowAdd = () => {
    setCurrentFilterList(emptyFilterList());
    setShowAdd(true);
  };

  const showEditModal = (filterList: FilterList) => {
    if (filterList._id) {
      setId(filterList._id);
    }
    setCurrentFilterList(filterList);
    setShowEdit(true);
    console.log(
      "showEditModal " + name + cids + filterList.name + filterList.cids
    );
  };

  const translateVisibility = (visibility: Visibility): string => {
    return VisibilityString[visibility];
  };

  const CIDFilter = (props: FilterList) => {
    return (
      <div>
        <a
          onClick={() => {
            showEditModal(props);
          }}
        >
          {props.name}
        </a>
        <span className={"ml-1 text-dim"}>
          [{translateVisibility(props.visibility)}:
          {props.cids ? props.cids.length : 0} items]
        </span>
      </div>
    );
  };

  const getFilters = async () => {
    const filters = await fetch(`${serverUri()}/filters`);
    const filterLists: FilterList[] = await filters.json();
    setFilterLists(filterLists);
    setFiltersCache(JSON.stringify(filterLists));
    console.log("filters loaded", JSON.stringify(filterLists));
    setLoaded(true);
  };

  useEffect(() => {
    void getFilters();
  }, []);

  const putFilters = async () => {
    if (filterLists.length === 0) return;
    if (JSON.stringify(filterLists) === filtersCache) return;

    await fetch(`${serverUri()}/filters`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(currentFilterList),
    });
    setFiltersCache(JSON.stringify(filterLists));
    console.log("filterList updated", JSON.stringify(currentFilterList));
  };

  const postFilters = async () => {
    await fetch(`${serverUri()}/filters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(currentFilterList),
    });
    setCurrentFilterList(emptyFilterList());
    setFiltersCache(JSON.stringify(filterLists));
    console.log("filters set", JSON.stringify(filterLists));
  };

  const saveFilter = () => {
    handleCloseEdit();

    putFilters().then(async () => {
      await getFilters();

      // be kind rewind
      setCurrentFilterList(emptyFilterList());
      console.log("filter saved " + name + cids);
    });
  };

  const addFilter = () => {
    handleCloseAdd();

    postFilters().then(async () => {
      await getFilters();

      // be kind rewind
      setCurrentFilterList(emptyFilterList());
      console.log("filter added " + name + cids);
    });
  };

  const importFilter = () => {
    handleCloseImport();

    // todo: implement

    console.log("filter imported");
  };

  const modalEntered = (): void => {
    return;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggleEnabled = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFilterList({
      ...currentFilterList,
      enabled: !currentFilterList.enabled,
    });
    setEnabled(!enabled);
  };

  // const cidsChanged = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
  //   event.preventDefault();
  const updateCurrentFileList = (filterList: FilterList) => {
    setCurrentFilterList({ ...currentFilterList, ...filterList });
    console.log("current cids updated to: " + cids);
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
                    <CIDFilter {...fl} />
                  </div>
                ))}
              </Col>
            </Row>
          </Container>

          <CustomFilterModal
            {...{
              show: showEdit,
              title: "Edit filter",
              handleClose: handleCloseEdit,
              save: saveFilter,
              modalEntered,
              dataChanged: updateCurrentFileList,
              filterList: currentFilterList,
            }}
          />

          <CustomFilterModal
            {...{
              show: showAdd,
              title: "New custom filter",
              handleClose: handleCloseAdd,
              save: addFilter,
              modalEntered,
              dataChanged: updateCurrentFileList,
              filterList: currentFilterList,
            }}
          />

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

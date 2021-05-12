import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import "./Filters.css";
import { serverUri } from "../../config";
import { FilterList, Visibility, VisibilityString } from "./Interfaces";

function Filters(): JSX.Element {
  const emptyFilterList = (): FilterList => {
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
  const [currentFilterList, setCurrentFilterList] = useState<FilterList>(
    emptyFilterList()
  );
  // const [enabled, setEnabled] = useState<boolean>(true);

  const translateVisibility = (visibility: Visibility): string => {
    return VisibilityString[visibility];
  };

  const CIDFilter = (props: FilterList) => {
    return (
      <div>
        <Link to={`/filters/edit/${props._id}`}>{props.name}</Link>
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

  const newFilterId = () => {
    const l = [emptyFilterList()].concat(filterLists);
    const ids = l.map((fl: FilterList) => fl._id);
    console.log("newfilterId: ids=" + ids);
    let id = 0;
    for (const i of ids) {
      if (i != null && i > id) {
        id = i;
      }
    }
    console.log("new filter id: " + (id + 1));
    return (id + 1).toString();
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
                <Link
                  className="btn-light"
                  to={(location) => `${location.pathname}/add/${newFilterId()}`}
                >
                  + new Filter
                </Link>
                <Link className="btn-light" to={`/filters/add/`}>
                  Import Filter
                </Link>
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
        </>
      ) : null}
    </>
  );
}

export default Filters;

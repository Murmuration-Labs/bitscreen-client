import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Button,
  Col,
  Container,
  Form,
  FormCheck,
  Row,
  Table,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import "./Filters.css";
import { FilterList, Visibility, VisibilityString } from "./Interfaces";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/fontawesome-free-solid";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faAtom } from "@fortawesome/free-solid-svg-icons";
import ApiService from "../../services/ApiService";
import { OverlayInjectedProps } from "react-bootstrap/Overlay";

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
    const filterLists: FilterList[] = await ApiService.getFilters();

    setFilterLists(filterLists);
    setFiltersCache(JSON.stringify(filterLists));

    setLoaded(true);
  };

  const toggleFilterEnabled = async (filterList: FilterList): Promise<void> => {
    console.log("in toggle");
    filterList.enabled = !filterList.enabled;
    await ApiService.updateFilter(filterList);
    await getFilters();
  };

  const adHocRandomBit = (): number => (Math.random() < 0.5 ? 0 : 1);

  const CIDFilterShared = (): JSX.Element => {
    if (adHocRandomBit()) {
      return <FontAwesomeIcon icon={faAtom as IconProp} />;
    }

    return <></>;
  };

  const CIDFilterScope = (): JSX.Element => {
    // in the future we will receive the scope flag in the function header
    // and use that instead of random
    // omitting param right now to pass linter

    if (adHocRandomBit()) {
      return <FontAwesomeIcon icon={faEye as IconProp} color={"green"} />;
    }

    return <FontAwesomeIcon icon={faEye as IconProp} color={"red"} />;
  };

  const CIDFilterRevamped = (): JSX.Element => {
    return (
      <div className={"card"}>
        <div className={"card-container"}>
          <Table>
            <thead>
              <tr>
                <th>Filter name</th>
                <th>Scope</th>
                <th>Shared?</th>
                <th># of CIDs</th>
                <th>Enabled?</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filterLists.map((filterList) => (
                <tr key={`filterList-${filterList._id}`}>
                  <td>{filterList.name}</td>
                  <td style={{ textAlign: "center" }}>
                    <CIDFilterScope />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <CIDFilterShared />
                  </td>
                  <td>
                    <OverlayTrigger
                      placement="right"
                      delay={{ show: 150, hide: 500 }}
                      transition={false}
                      overlay={(props: OverlayInjectedProps): JSX.Element => (
                        <Tooltip id="button-tooltip" {...props}>
                          {filterList.cids.map((cid, index) => (
                            <p key={`cid-${filterList._id}-${index}`}>{cid}</p>
                          ))}
                        </Tooltip>
                      )}
                    >
                      <span
                        style={{
                          textAlign: "center",
                          color: "blue",
                          fontWeight: "bold",
                        }}
                      >
                        {filterList.cids ? filterList.cids.length : 0}
                      </span>
                    </OverlayTrigger>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div onClick={() => toggleFilterEnabled(filterList)}>
                      <FormCheck
                        readOnly
                        type="switch"
                        checked={filterList.enabled}
                      />
                    </div>
                  </td>
                  <td>other actions</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    );
  };

  useEffect(() => {
    void getFilters();
  }, []);

  const putFilters = async () => {
    if (filterLists.length === 0) return;
    if (JSON.stringify(filterLists) === filtersCache) return;

    await ApiService.updateFilter(currentFilterList);

    setFiltersCache(JSON.stringify(filterLists));
  };

  const postFilters = async () => {
    await ApiService.addFilter(currentFilterList);

    setCurrentFilterList(emptyFilterList());
    setFiltersCache(JSON.stringify(filterLists));
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

            {/*<Row>*/}
            {/*  <Col>*/}
            {/*    {filterLists.map((fl) => (*/}
            {/*      <div className={"mt-1"} key={`filters-${fl._id}`}>*/}
            {/*        <CIDFilter {...fl} />*/}
            {/*      </div>*/}
            {/*    ))}*/}
            {/*  </Col>*/}
            {/*</Row>*/}

            <Row>
              <Col>
                <CIDFilterRevamped />
              </Col>
            </Row>
          </Container>
        </>
      ) : null}
    </>
  );
}

export default Filters;

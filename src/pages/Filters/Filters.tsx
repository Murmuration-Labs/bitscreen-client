import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Col,
  Container,
  Form,
  FormCheck,
  Row,
  Table,
  OverlayTrigger,
  Tooltip,
  Badge,
} from "react-bootstrap";
import "./Filters.css";
import { FilterList, Visibility, VisibilityString } from "./Interfaces";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faTrash, faEdit } from "@fortawesome/free-solid-svg-icons";
import { faAtom } from "@fortawesome/free-solid-svg-icons";
import ApiService from "../../services/ApiService";
import { OverlayInjectedProps } from "react-bootstrap/Overlay";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import debounce from "lodash.debounce";

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

  const getFilters = async (searchTerm?: string) => {
    const filterLists: FilterList[] = await ApiService.getFilters(searchTerm);

    setFilterLists(filterLists);
    setFiltersCache(JSON.stringify(filterLists));

    setLoaded(true);
  };

  const deleteFilter = async (id: number) => {
    await ApiService.deleteFilter(id);

    await getFilters();
  };

  const toggleFilterEnabled = async (filterList: FilterList): Promise<void> => {
    filterList.enabled = !filterList.enabled;
    await ApiService.updateFilter(filterList);
    await getFilters();
  };

  const [show, setShow] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("false");
  const [deletedFilterList, setDeletedFilterList] = useState<FilterList>(
    emptyFilterList()
  );
  const [confirmDeleteCallback, setConfirmDeleteCallback] = useState<
    (result: boolean) => void
  >((result = false) => {
    console.log(typeof result);
  });

  const confirmDelete = (filterList: FilterList): void => {
    setShow(true);
    setDeletedFilterList(filterList);
  };

  const debounceSearchFilters = debounce((searchTerm): void => {
    getFilters(searchTerm);
  }, 300);

  const searchFilters = (event): void => {
    debounceSearchFilters(event.target.value);
  };

  useEffect(() => {
    setTitle(`Delete filter ${deletedFilterList._id}`);
    setMessage(
      `Are you sure you want to delete filter "${deletedFilterList.name}?"`
    );
  }, [show, deletedFilterList]);

  const adHocRandomBit = (): number => 0;

  const CIDFilterShared = (): JSX.Element => {
    if (adHocRandomBit()) {
      return <FontAwesomeIcon icon={faAtom as IconProp} />;
    }

    return <></>;
  };

  const CIDFilterScope = (props: FilterList): JSX.Element => {
    const variantMapper = {
      [Visibility.None]: "secondary",
      [Visibility.Private]: "danger",
      [Visibility.Public]: "success",
      [Visibility.ThirdParty]: "warning",
    };

    return (
      <Badge variant={variantMapper[props.visibility]}>
        {translateVisibility(props.visibility)}
      </Badge>
    );
  };

  const CIDFilter = (): JSX.Element => {
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
                  <td>
                    <CIDFilterScope {...filterList} />
                  </td>
                  <td>
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
                  <td>
                    <div onClick={() => toggleFilterEnabled(filterList)}>
                      <FormCheck
                        readOnly
                        type="switch"
                        checked={filterList.enabled}
                      />
                    </div>
                  </td>
                  <td style={{ textAlign: "justify" }}>
                    <Link to="#" onClick={() => confirmDelete(filterList)}>
                      <FontAwesomeIcon icon={faTrash as IconProp} />
                    </Link>
                    <Link to={`/filters/edit/${filterList._id}`}>
                      <FontAwesomeIcon icon={faEdit as IconProp} />
                    </Link>
                  </td>
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
                    <Form.Control
                      type="text"
                      placeholder="Search CID"
                      onChange={searchFilters}
                    />
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
                <CIDFilter />
              </Col>
            </Row>

            <ConfirmModal
              show={show}
              title={title}
              message={message}
              callback={() => {
                deleteFilter(deletedFilterList._id ? deletedFilterList._id : 0);
              }}
              closeCallback={() => {
                setDeletedFilterList(emptyFilterList());
                setShow(false);
              }}
            />
          </Container>
        </>
      ) : null}
    </>
  );
}

export default Filters;

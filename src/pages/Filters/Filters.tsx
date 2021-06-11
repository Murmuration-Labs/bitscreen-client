import React, { useEffect, useState } from "react";
import { Link, useHistory } from "react-router-dom";
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
  Button,
} from "react-bootstrap";
import "./Filters.css";
import { FilterList, Visibility, VisibilityString } from "./Interfaces";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faTrash,
  faEdit,
  faExternalLinkAlt,
} from "@fortawesome/free-solid-svg-icons";
import { faGlobe } from "@fortawesome/free-solid-svg-icons";
import ApiService from "../../services/ApiService";
import { OverlayInjectedProps } from "react-bootstrap/Overlay";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import FilterService from "../../services/FilterService";
import debounce from "lodash.debounce";
import ImportFilterModal from "./ImportFilterModal";

function Filters(): JSX.Element {
  const [filterLists, setFilterLists] = useState<FilterList[]>([]);
  // const [filtersCache, setFiltersCache] = useState<string>("");

  const [loaded, setLoaded] = useState<boolean>(false);
  // const [enabled, setEnabled] = useState<boolean>(true);

  const translateVisibility = (visibility: Visibility): string => {
    return VisibilityString[visibility];
  };

  const getFilters = async (searchTerm?: string) => {
    const filterLists: FilterList[] = await ApiService.getFilters(searchTerm);

    setFilterLists(filterLists);
    // setFiltersCache(JSON.stringify(filterLists));

    setLoaded(true);
  };

  const deleteFilter = async (id: number) => {
    await ApiService.deleteFilter(id);

    await getFilters();
  };

  const toggleFilterEnabled = async (filterList: FilterList): Promise<void> => {
    if (filterList.origin) return;
    filterList.enabled = !filterList.enabled;
    await ApiService.updateFilter(filterList);
    await getFilters();
  };

  const toggleFilterOverride = async (
    filterList: FilterList
  ): Promise<void> => {
    if (filterList.origin) return;
    filterList.override = !filterList.override;
    await ApiService.updateFilter(filterList);
    await getFilters();
  };

  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("false");
  const [deletedFilterList, setDeletedFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );

  const confirmDelete = (filterList: FilterList): void => {
    setShowConfirmDelete(true);
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
  }, [showConfirmDelete, deletedFilterList]);

  const CIDFilterShared = (props: FilterList): JSX.Element => {
    if (props.origin) {
      return <FontAwesomeIcon icon={faGlobe as IconProp} />;
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
                <th>Override?</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filterLists.map((filterList) => (
                <tr key={`filterList-${filterList._id}`}>
                  <td>
                    <Link
                      to={`/filters/edit/${filterList._id}`}
                      className="double-space-left"
                    >
                      {filterList.name}
                    </Link>
                  </td>
                  <td>
                    <CIDFilterScope {...filterList} />
                  </td>
                  <td>
                    <CIDFilterShared {...filterList} />
                  </td>
                  <td>
                    <OverlayTrigger
                      placement="right"
                      delay={{ show: 150, hide: 500 }}
                      transition={false}
                      overlay={(props: OverlayInjectedProps): JSX.Element => (
                        <Tooltip id="button-tooltip" {...props}>
                          {filterList.cids.map((cid, index) => (
                            <p key={`cid-${filterList._id}-${index}`}>
                              {filterList.origin
                                ? FilterService.renderHashedCid(cid)
                                : cid}
                            </p>
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
                        disabled={!!filterList.origin}
                      />
                    </div>
                  </td>
                  <td>
                    <div onClick={() => toggleFilterOverride(filterList)}>
                      <FormCheck
                        readOnly
                        type="switch"
                        checked={
                          filterList.override ? filterList.override : false
                        }
                      />
                    </div>
                  </td>
                  <td style={{ textAlign: "justify" }}>
                    <Link
                      to={`/filters/edit/${filterList._id}`}
                      className="double-space-left"
                    >
                      <FontAwesomeIcon icon={faEdit as IconProp} />
                    </Link>
                    <Link
                      to="#"
                      onClick={() => confirmDelete(filterList)}
                      className="double-space-left"
                    >
                      <FontAwesomeIcon icon={faTrash as IconProp} />
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

  const newFilterId = () => {
    const l = [FilterService.emptyFilterList()].concat(filterLists);
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

  const [showImportFilter, setShowImportFilter] = useState<boolean>(false);

  const history = useHistory();

  return (
    <div>
      {loaded ? (
        <div>
          <Container>
            <h2>Filters</h2>
            <Row style={{ marginBottom: 12 }}>
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
                <Button
                  variant="primary"
                  onClick={() =>
                    history.push(`${location.pathname}/add/${newFilterId()}`)
                  }
                >
                  + new Filter
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowImportFilter(true);
                  }}
                  className="double-space-left"
                >
                  Import Filter
                </Button>
              </Col>
            </Row>

            <Row>
              <Col>
                <CIDFilter />
              </Col>
            </Row>

            <ConfirmModal
              show={showConfirmDelete}
              title={title}
              message={message}
              callback={() => {
                deleteFilter(deletedFilterList._id ? deletedFilterList._id : 0);
              }}
              closeCallback={() => {
                setDeletedFilterList(FilterService.emptyFilterList());
                setShowConfirmDelete(false);
              }}
            />

            <ImportFilterModal
              closeCallback={async (refreshParent = false): Promise<void> => {
                setShowImportFilter(false);
                if (refreshParent) {
                  await getFilters();
                }
              }}
              show={showImportFilter}
            />
          </Container>
        </div>
      ) : null}
    </div>
  );
}

export default Filters;

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faEdit,
  faEye,
  faGlobe,
  faShare,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import debounce from "lodash.debounce";
import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Col,
  Container,
  Dropdown,
  Form,
  FormCheck,
  OverlayTrigger,
  Row,
  Table,
  Tooltip,
} from "react-bootstrap";
import { OverlayInjectedProps } from "react-bootstrap/Overlay";
import { Link, useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import { serverUri } from "../../config";
import ApiService from "../../services/ApiService";
import FilterService from "../../services/FilterService";
import "./Filters.css";
import ImportFilterModal from "./ImportFilterModal";
import {
  BulkSelectedType,
  CidItem,
  FilterList,
  Visibility,
  VisibilityString,
} from "./Interfaces";

function Filters(): JSX.Element {
  const [filterLists, setFilterLists] = useState<FilterList[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loaded, setLoaded] = useState<boolean>(false);

  const translateVisibility = (visibility: Visibility): string => {
    return VisibilityString[visibility];
  };

  const getFilters = async () => {
    const filterLists: FilterList[] = await ApiService.getFilters({
      q: searchTerm,
    });

    setFilterLists(filterLists);

    setLoaded(true);
  };

  const deleteFilter = async (filter: FilterList) => {
    await ApiService.deleteFilter(filter);
    await getFilters();
  };

  const toggleFilterEnabled = async (filterList: FilterList): Promise<void> => {
    filterList.enabled = !filterList.enabled;
    await ApiService.updateFilter([filterList], false);
    await getFilters();
  };

  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("false");
  const [deletedFilterList, setDeletedFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );

  const [showConfirmEnableBulkAction, setShowConfirmEnableBulkAction] =
    useState<boolean>(false);
  const [confirmEnableBulkActionMessage, setConfirmEnableBulkActionMessage] =
    useState<string>("");

  const [showConfirmDisableBulkAction, setShowConfirmDisableBulkAction] =
    useState<boolean>(false);
  const [confirmDisableBulkActionMessage, setConfirmDisableBulkActionMessage] =
    useState<string>("");

  const confirmDelete = (filterList: FilterList): void => {
    setShowConfirmDelete(true);
    setDeletedFilterList(filterList);
  };

  const debounceSearchFilters = debounce(() => getFilters(), 300);

  const searchFilters = (event): void => {
    setSearchTerm(event.target.value);
  };

  const clipboardCopy = (cryptId) => {
    console.log(serverUri(), cryptId);
    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = serverUri() + "/filter/share/" + cryptId;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
    toast.success("Shared link was copied succesfully");
  };

  useEffect(() => {
    let message = `Are you sure you want to delete filter "${deletedFilterList.name}?"`;
    let title = `Delete filter ${deletedFilterList.id}`;
    if (deletedFilterList.originId) {
      message = `Are you sure you want to discard filter "${deletedFilterList.name}?"`;
      title = `Discard filter ${deletedFilterList.id}`;
    }
    setTitle(title);
    setMessage(message);
  }, [showConfirmDelete, deletedFilterList]);

  const CIDFilterShared = (props: FilterList): JSX.Element => {
    if (props.originId) {
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
      <div>
        <Badge variant={variantMapper[props.visibility]}>
          {translateVisibility(props.visibility)}
        </Badge>
        {props.override ? <Badge variant="success">Override</Badge> : <></>}
      </div>
    );
  };

  const editOrEyeIcon = (props: FilterList): JSX.Element => {
    if (props.originId) {
      return <FontAwesomeIcon icon={faEye as IconProp} />;
    }

    return <FontAwesomeIcon icon={faEdit as IconProp} />;
  };

  const CIDFilter = (): JSX.Element => {
    return (
      <div className={"card"}>
        <div className={"card-container"}>
          <p>
            {filterLists ? filterLists.length : "0"} result
            {filterLists.length === 1 ? "" : "s"} found
          </p>
          <Table>
            <thead>
              <tr>
                <th>Bulk</th>
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
                <tr key={`filterList-${filterList.id}`}>
                  <td>
                    <Form.Check
                      type="checkbox"
                      checked={filterList.isBulkSelected}
                      onChange={() => {
                        filterList.isBulkSelected = !filterList.isBulkSelected;
                        setFilterLists([...filterLists]);
                      }}
                    />
                  </td>
                  <td>
                    <Link
                      to={`/filters/edit/${filterList.id}`}
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
                    {filterList.cids && filterList.cids.length ? (
                      <OverlayTrigger
                        placement="right"
                        delay={{ show: 150, hide: 500 }}
                        transition={false}
                        overlay={(props: OverlayInjectedProps): JSX.Element => (
                          <Tooltip id="button-tooltip" {...props}>
                            {filterList.cids.map(
                              (cidItem: CidItem, index: number) => (
                                <p key={`cid-${filterList.id}-${index}`}>
                                  {filterList.originId
                                    ? FilterService.renderHashedCid(cidItem)
                                    : cidItem.cid}
                                </p>
                              )
                            )}
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
                    ) : (
                      0
                    )}
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
                    <Link
                      to={`/filters/edit/${filterList.id}`}
                      className="double-space-left"
                    >
                      {editOrEyeIcon(filterList)}
                    </Link>
                    <Link
                      to="#"
                      onClick={() => confirmDelete(filterList)}
                      className="double-space-left"
                    >
                      <FontAwesomeIcon icon={faTrash as IconProp} />
                    </Link>
                    {!filterList.originId && (
                      <Link
                        to="#"
                        onClick={() => clipboardCopy(filterList.shareId)}
                        className="double-space-left"
                      >
                        <FontAwesomeIcon icon={faShare as IconProp} />
                      </Link>
                    )}
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
    debounceSearchFilters();
  }, [searchTerm]);

  const [showImportFilter, setShowImportFilter] = useState<boolean>(false);

  const history = useHistory();

  const [isAllLoaded, setIsAllLoaded] = useState<boolean>(false);

  useEffect(() => {
    const isAllLoadedNow = filterLists.reduce(
      (acc: boolean, filterList: FilterList) =>
        acc && !!filterList.isBulkSelected,
      true
    ) as boolean;

    setIsAllLoaded(isAllLoadedNow);
  }, [filterLists]);

  const beginBulkSetEnabled = (enabled: boolean): void => {
    const selectedFilters = filterLists.filter((x) => x.isBulkSelected);

    if (enabled) {
      setShowConfirmEnableBulkAction(true);
      setConfirmEnableBulkActionMessage(
        `Are you sure you want to enable ${selectedFilters.length} items?`
      );
    } else {
      setShowConfirmDisableBulkAction(true);
      setConfirmDisableBulkActionMessage(
        `Are you sure you want to disable ${selectedFilters.length} items?`
      );
    }
  };

  const bulkSetEnabled = async (enabled: boolean): Promise<void> => {
    const selectedFilters = filterLists
      .filter((x) => x.isBulkSelected)
      .map((x) => ({
        ...x,
        enabled,
      }));

    await ApiService.updateFilter(selectedFilters, false);

    // update in front as well
    for (let i = 0; i < filterLists.length; i++) {
      if (filterLists[i].isBulkSelected) {
        filterLists[i].isBulkSelected = false;
        filterLists[i].enabled = enabled;
      }
    }

    setFilterLists([...filterLists]);
  };

  const bulkModifySelectedFilters = (
    only = BulkSelectedType.All,
    futureValue = true
  ): void => {
    let conditional = (x: FilterList) => true;

    switch (only) {
      case BulkSelectedType.Private:
        conditional = (x: FilterList) => x.visibility === Visibility.Private;
        break;

      case BulkSelectedType.Public:
        conditional = (x: FilterList) => x.visibility === Visibility.Public;
        break;

      case BulkSelectedType.Imported:
        conditional = (x: FilterList) => !!x.originId;
        break;

      default:
        break;
    }

    for (let i = 0; i < filterLists.length; i++) {
      if (conditional(filterLists[i])) {
        filterLists[i].isBulkSelected = futureValue;
      } else {
        filterLists[i].isBulkSelected = !futureValue;
      }
    }

    setFilterLists([...filterLists]);
  };

  let isOneSelected = false;
  for (let i = 0; i < filterLists.length; i++) {
    if (filterLists[i].isBulkSelected) {
      isOneSelected = true;
      break;
    }
  }

  return (
    <div>
      {loaded ? (
        <div>
          <Container>
            <h2>Filters</h2>
            <Row style={{ marginBottom: 12 }}>
              <Col>
                <Row>
                  <Col className="d-flex flex-row align-items-center">
                    <Form.Group
                      controlId="selectAll"
                      className="d-flex align-items-center"
                      style={{
                        height: "100%",
                        paddingLeft: "28px",
                        marginBottom: 0,
                      }}
                    >
                      <Form.Check
                        type="checkbox"
                        checked={isAllLoaded}
                        onChange={() => {
                          bulkModifySelectedFilters(
                            BulkSelectedType.All,
                            !isAllLoaded
                          );
                        }}
                      />
                    </Form.Group>
                    <Dropdown>
                      <Dropdown.Toggle
                        style={{
                          display: "flex",
                          height: "20px",
                          alignItems: "center",
                          borderRadius: "0.5",
                        }}
                        id="dropdown-select-all"
                        className="custom-dropdown-filters"
                        variant="secondary"
                      />
                      <Dropdown.Menu>
                        <Dropdown.Item
                          href="#"
                          onClick={() => {
                            bulkModifySelectedFilters();
                          }}
                        >
                          All
                        </Dropdown.Item>
                        <Dropdown.Item
                          href="#"
                          onClick={() => {
                            bulkModifySelectedFilters(BulkSelectedType.Public);
                          }}
                        >
                          Public
                        </Dropdown.Item>
                        <Dropdown.Item
                          href="#"
                          onClick={() => {
                            bulkModifySelectedFilters(BulkSelectedType.Private);
                          }}
                        >
                          Private
                        </Dropdown.Item>
                        <Dropdown.Item
                          href="#"
                          onClick={() => {
                            bulkModifySelectedFilters(
                              BulkSelectedType.Imported
                            );
                          }}
                        >
                          Imported
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </Col>
                  <Col>
                    <Button
                      disabled={!isOneSelected}
                      onClick={() => beginBulkSetEnabled(true)}
                    >
                      Enable
                    </Button>
                  </Col>
                  <Col>
                    <Button
                      disabled={!isOneSelected}
                      onClick={() => beginBulkSetEnabled(false)}
                    >
                      Disable
                    </Button>
                  </Col>
                </Row>
              </Col>
              <Col>
                <Form.Group controlId="search">
                  <Form.Control
                    type="text"
                    placeholder="Search CID or Filter Name"
                    onChange={searchFilters}
                    onKeyDown={(
                      event: React.KeyboardEvent<HTMLInputElement>
                    ) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                      }
                    }}
                  />
                </Form.Group>
              </Col>
              <Col className="text-right">
                <Button
                  variant="primary"
                  onClick={() => history.push(`/filters/new`)}
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
                deleteFilter(deletedFilterList);
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

            <ConfirmModal
              show={showConfirmEnableBulkAction}
              title={"Confirm bulk enable filters"}
              message={confirmEnableBulkActionMessage}
              callback={() => bulkSetEnabled(true)}
              closeCallback={() => {
                setShowConfirmEnableBulkAction(false);
                setConfirmEnableBulkActionMessage("");
              }}
            />
            <ConfirmModal
              show={showConfirmDisableBulkAction}
              title={"Confirm bulk disable filters"}
              message={confirmDisableBulkActionMessage}
              callback={() => bulkSetEnabled(false)}
              closeCallback={() => {
                setShowConfirmDisableBulkAction(false);
                setConfirmDisableBulkActionMessage("");
              }}
            />
          </Container>
        </div>
      ) : null}
    </div>
  );
}

export default Filters;

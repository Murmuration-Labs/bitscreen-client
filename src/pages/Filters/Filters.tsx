import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faEdit,
  faEye,
  faShare,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { isOrphan, isEnabled, isDisabled } from "./utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import _ from "lodash";
import debounce from "lodash.debounce";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Col,
  Container,
  Dropdown,
  Form,
  FormCheck,
  Row,
  Table,
} from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import { serverUri } from "../../config";
import ApiService from "../../services/ApiService";
import * as AuthService from "../../services/AuthService";
import FilterService from "../../services/FilterService";
import "./Filters.css";
import ImportFilterModal from "./ImportFilterModal";
import {
  BulkSelectedType,
  EnabledOption,
  FilterList,
  Visibility,
  VisibilityString,
} from "./Interfaces";
import ToggleEnabledFilterModal from "./ToggleEnabledFilterModal";

function Filters(): JSX.Element {
  /**
   * UTILS
   */

  const [enabledFilters, setEnabledFilters] = useState<FilterList[]>([]);
  const [disabledFilters, setDisabledFilters] = useState<FilterList[]>([]);
  const [orphanFilters, setOrphanFilters] = useState<FilterList[]>([]);

  const [enabledSelectedFilters, setEnabledSelectedFilters] = useState<
    FilterList[]
  >([]);
  const [disabledSelectedFilters, setDisabledSelectedFilters] = useState<
    FilterList[]
  >([]);
  const [orphanSelectedFilters, setOrphanSelectedFilters] = useState<
    FilterList[]
  >([]);

  const { enqueueSnackbar } = useSnackbar();

  const [filterLists, setFilterLists] = useState<FilterList[]>([]);
  const [selectedConditional, setSelectedConditional] =
    useState<BulkSelectedType>(BulkSelectedType.None);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loaded, setLoaded] = useState<boolean>(false);
  const [showConfirmDiscardBulkAction, setShowConfirmDiscardBulkAction] =
    useState(false);
  const [confirmDiscardBulkActionMessage, setConfirmDiscardBulkActionMessage] =
    useState("");
  const translateVisibility = (visibility: Visibility): string => {
    return VisibilityString[visibility];
  };

  useEffect(() => {
    setEnabledSelectedFilters(
      enabledFilters.filter(({ isBulkSelected }) => isBulkSelected)
    );
  }, [enabledFilters]);

  useEffect(() => {
    setDisabledSelectedFilters(
      disabledFilters.filter(({ isBulkSelected }) => isBulkSelected)
    );
  }, [disabledFilters]);

  useEffect(() => {
    setOrphanSelectedFilters(
      orphanFilters.filter(({ isBulkSelected }) => isBulkSelected)
    );
  }, [orphanFilters]);

  useEffect(() => {
    if (!filterLists || !filterLists.length) {
      return;
    }

    let conditional = (x: FilterList) => false;

    switch (selectedConditional) {
      case BulkSelectedType.None:
        conditional = () => false;
        break;
      case BulkSelectedType.All:
        conditional = () => true;
        break;
      case BulkSelectedType.Private:
        conditional = (x: FilterList) => x.visibility === Visibility.Private;
        break;
      case BulkSelectedType.Public:
        conditional = (x: FilterList) => x.visibility === Visibility.Public;
        break;

      case BulkSelectedType.Imported:
        // this condition is enough,
        // because the backend already verifies that
        // provider_filter exists
        conditional = (x: FilterList) =>
          AuthService.getProviderId() !== x.provider.id;
        break;

      case BulkSelectedType.Shared:
        conditional = (x: FilterList) =>
          AuthService.getProviderId() === x.provider.id &&
          !!x.provider_Filters &&
          x.provider_Filters.length > 1;
        break;

      case BulkSelectedType.Orphan:
        conditional = (x: FilterList) => {
          return (
            !!x.provider_Filters &&
            !x.provider_Filters.some((pf) => pf.provider.id === x.provider.id)
          );
        };
        break;

      case BulkSelectedType.Override:
        conditional = (x: FilterList) => x.override;
        break;

      default:
        break;
    }

    const newFilterLists = filterLists.map((f) => ({
      ...f,
      isBulkSelected: conditional(f),
    }));

    if (_.isEqual(newFilterLists, filterLists)) {
      return;
    }

    setFilterLists(newFilterLists);
  }, [selectedConditional]);

  const getFilters = async () => {
    const filterLists: FilterList[] = await ApiService.getFilters(searchTerm);

    setFilterLists(filterLists);
    setSelectedConditional(BulkSelectedType.None);

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

  const [showConfirmEnabled, setShowConfirmEnabled] = useState<boolean>(false);
  const [selectedFilterList, setSelectedFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );

  const toggleSharedFilterEnabled = async (
    option: EnabledOption
  ): Promise<void> => {
    if (option === EnabledOption.Local) {
      await toggleFilterEnabled(selectedFilterList);
    } else if (option === EnabledOption.Global) {
      await ApiService.updateEnabledForSharedFilters(
        [selectedFilterList.id],
        !selectedFilterList.enabled
      );
      await getFilters();
    }
  };

  const confirmDelete = (filterList: FilterList): void => {
    setShowConfirmDelete(true);
    setDeletedFilterList(filterList);
  };

  const debounceSearchFilters = debounce(() => getFilters(), 300);

  const searchFilters = (event): void => {
    setSearchTerm(event.target.value);
  };

  const clipboardCopy = (cryptId) => {
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

  const CIDFilterScope = (props: FilterList): JSX.Element => {
    const variantMapper = {
      [Visibility.None]: "secondary",
      [Visibility.Private]: "danger",
      [Visibility.Public]: "success",
      [Visibility.ThirdParty]: "warning",
    };

    const isShared =
      props.provider_Filters &&
      props.provider_Filters.length > 1 &&
      props.provider.id === AuthService.getProviderId();

    const isImported = props.provider.id !== AuthService.getProviderId();

    const orphan = isOrphan(props);

    const isOverride = props.override;

    return (
      <Row style={{ display: "flex", flexDirection: "column" }}>
        <Col>
          <Badge variant={variantMapper[props.visibility]}>
            {translateVisibility(props.visibility)}
          </Badge>
        </Col>
        {isOverride && (
          <Col>
            <Badge variant="success">Override</Badge>
          </Col>
        )}
        {isShared && (
          <Col>
            <Badge variant="info">Shared</Badge>
          </Col>
        )}
        {isImported && (
          <Col>
            <Badge variant="dark">Imported</Badge>
          </Col>
        )}
        {orphan && (
          <Col>
            <Badge variant="light">Orphan</Badge>
          </Col>
        )}
      </Row>
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
            {filterLists && filterLists.length === 1 ? "" : "s"} found
          </p>
          <Table>
            <thead>
              <tr>
                <th>Bulk</th>
                <th>Filter name</th>
                <th>Scope</th>
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
                    <span
                      style={{
                        textAlign: "center",
                        color: "blue",
                        fontWeight: "bold",
                      }}
                    >
                      {filterList.cids && filterList.cids.length
                        ? filterList.cids.length
                        : filterList.cidsCount || 0}
                    </span>
                  </td>
                  <td>
                    {!(
                      filterList.provider_Filters &&
                      !filterList.provider_Filters.some(
                        (pf) => pf.provider.id === filterList.provider.id
                      )
                    ) && (
                      <div
                        onClick={() => {
                          setSelectedFilterList(filterList);
                          setShowConfirmEnabled(true);
                        }}
                      >
                        <FormCheck
                          readOnly
                          type="switch"
                          checked={filterList.enabled}
                        />
                      </div>
                    )}
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

    setEnabledFilters(filterLists.filter((f) => isEnabled(f)));
    setDisabledFilters(filterLists.filter((f) => isDisabled(f)));
    setOrphanFilters(filterLists.filter((f) => isOrphan(f)));
  }, [filterLists]);

  const beginBulkSetEnabled = (val: boolean): void => {
    const disabled = disabledFilters.filter((x) => x.isBulkSelected);
    const enabled = enabledFilters.filter((x) => x.isBulkSelected);

    if (val) {
      setShowConfirmEnableBulkAction(true);
      setConfirmEnableBulkActionMessage(
        `Are you sure you want to enable ${disabled.length} items?`
      );
    } else {
      setShowConfirmDisableBulkAction(true);
      setConfirmDisableBulkActionMessage(
        `Are you sure you want to disable ${enabled.length} items?`
      );
    }
  };

  const beginBulkDiscardOrphans = () => {
    setShowConfirmDiscardBulkAction(true);
    setConfirmDiscardBulkActionMessage(
      `Are you sure you want to discard ${orphanSelectedFilters.length} items?`
    );
  };

  const bulkDiscardOrphans = () => {
    Promise.all(orphanSelectedFilters.map((f) => ApiService.deleteFilter(f)))
      .then(() => {
        enqueueSnackbar("Successfully discarded all.", {
          variant: "success",
          preventDuplicate: true,
          anchorOrigin: {
            horizontal: "right",
            vertical: "top",
          },
        });
      })
      .catch(() => {
        enqueueSnackbar("One or more filters could not be discarded.", {
          variant: "error",
          preventDuplicate: true,
          anchorOrigin: {
            horizontal: "right",
            vertical: "top",
          },
        });
      })
      .finally(() => getFilters());
  };

  const bulkSetEnabled = async (enabled: boolean) => {
    await ApiService.updateFilter(
      (enabled ? disabledSelectedFilters : enabledSelectedFilters).map((x) => ({
        ...x,
        enabled,
      })),
      false
    );

    getFilters();
  };

  return (
    <div>
      {loaded ? (
        <div>
          <Container>
            <h2>Filters</h2>
            <Row style={{ marginBottom: 12 }}>
              <Col>
                <Row className="d-flex flex-row justify-content-start">
                  <Col className="d-flex flex-row">
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
                        onChange={() =>
                          setSelectedConditional(
                            isAllLoaded
                              ? BulkSelectedType.None
                              : BulkSelectedType.All
                          )
                        }
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
                        {Object.keys(BulkSelectedType)
                          .filter((key) => isNaN(parseInt(key)))
                          .map((key, idx) => (
                            <Dropdown.Item
                              key={idx}
                              href="#"
                              onClick={() =>
                                setSelectedConditional(BulkSelectedType[key])
                              }
                            >
                              {key}
                            </Dropdown.Item>
                          ))}
                      </Dropdown.Menu>
                    </Dropdown>
                  </Col>
                  {!!disabledSelectedFilters.length && (
                    <Col>
                      <Button onClick={() => beginBulkSetEnabled(true)}>
                        Enable {disabledSelectedFilters.length}
                      </Button>
                    </Col>
                  )}

                  {!!enabledSelectedFilters.length && (
                    <Col>
                      <Button onClick={() => beginBulkSetEnabled(false)}>
                        Disable {enabledSelectedFilters.length}
                      </Button>
                    </Col>
                  )}

                  {!!orphanSelectedFilters.length && (
                    <Col>
                      <Button onClick={() => beginBulkDiscardOrphans()}>
                        Discard {orphanSelectedFilters.length}
                      </Button>
                    </Col>
                  )}
                </Row>
              </Col>
              <Col className="text-right">
                <Button
                  variant="primary"
                  onClick={() => history.push(`/filters/new`)}
                >
                  New Filter
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

            <ConfirmModal
              show={showConfirmDiscardBulkAction}
              title={"Confirm bulk discard filters"}
              message={confirmDiscardBulkActionMessage}
              callback={() => bulkDiscardOrphans()}
              closeCallback={() => {
                setShowConfirmDiscardBulkAction(false);
                setConfirmDiscardBulkActionMessage("");
              }}
            />

            <ToggleEnabledFilterModal
              show={showConfirmEnabled}
              callback={toggleSharedFilterEnabled}
              closeCallback={() => {
                setSelectedFilterList(FilterService.emptyFilterList());
                setShowConfirmEnabled(false);
              }}
            />
          </Container>
        </div>
      ) : null}
    </div>
  );
}

export default Filters;

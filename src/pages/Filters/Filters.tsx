import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faEdit,
  faEye,
  faTrash,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons";
import { isOrphan, isEnabled, isDisabled, isShared, isImported } from "./utils";
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
  OverlayTrigger,
  Row,
  Table,
  Tooltip,
} from "react-bootstrap";
import { TableContainer, TablePagination } from "@material-ui/core";
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
  Config,
  EnabledOption,
  FilterList,
  Visibility,
  VisibilityString,
} from "./Interfaces";
import ToggleEnabledFilterModal from "./ToggleEnabledFilterModal";
import axios from "axios";

function Filters(): JSX.Element {
  /**
   * UTILS
   */

  // ----------------------- PAGINATION -----------------------
  const [dataCount, setDataCount] = React.useState<number>(0);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  // ----------------------- PAGINATION -----------------------

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

  const [account, setAccount] = useState(AuthService.getAccount());
  const [configuration, setConfiguration] = useState<Config>({
    bitscreen: false,
    import: false,
    share: false,
  });

  useEffect(() => {
    async function setInitialConfig() {
      const response = await axios.get(`${serverUri()}/config`);
      const config = response.data;

      setConfiguration(config);
    }

    setInitialConfig();
  }, []);

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

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getFilters = async () => {
    const data = await ApiService.getFilters({
      isPaged: true,
      page,
      perPage: rowsPerPage,
      searchTerm,
    });
    const filterLists: FilterList[] = data.filters;

    setFilterLists(filterLists);
    setDataCount(data.count);
    setSelectedConditional(BulkSelectedType.None);

    setLoaded(true);
  };

  useEffect(() => {
    getFilters();
  }, [rowsPerPage, page]);

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

  const [bulkEnabled, setBulkEnabled] = useState<boolean | undefined>(
    undefined
  );
  const [showConfirmEnabled, setShowConfirmEnabled] = useState<boolean>(false);
  const [selectedFilterList, setSelectedFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );

  const toggleLocalFilterEnabled = async (): Promise<void> => {
    if (bulkEnabled === true) {
      const fls = disabledSelectedFilters.map((x) => {
        return {
          ...x,
          enabled: true,
        };
      });
      await ApiService.updateFilter(fls, false);
    } else if (bulkEnabled === false) {
      const fls = enabledSelectedFilters.map((x) => {
        return {
          ...x,
          enabled: false,
        };
      });
      await ApiService.updateFilter(fls, false);
    } else {
      const fl = {
        ...selectedFilterList,
        enabled: !selectedFilterList.enabled,
      };
      await ApiService.updateFilter([fl], false);
    }
  };

  const toggleGlobalFilterEnabled = async (): Promise<void> => {
    if (bulkEnabled === true) {
      const ids = disabledSelectedFilters.map((x) => x.id);
      await ApiService.updateEnabledForSharedFilters(ids, true);
    } else if (bulkEnabled === false) {
      const ids = enabledSelectedFilters.map((x) => x.id);
      await ApiService.updateEnabledForSharedFilters(ids, false);
    } else {
      await ApiService.updateEnabledForSharedFilters(
        [selectedFilterList.id],
        !selectedFilterList.enabled
      );
    }
  };

  const toggleSharedFilterEnabled = async (
    option: EnabledOption
  ): Promise<void> => {
    if (option === EnabledOption.Local) {
      await toggleLocalFilterEnabled();
    } else if (option === EnabledOption.Global) {
      await toggleGlobalFilterEnabled();
    }
    await getFilters();
  };

  const confirmDelete = (filterList: FilterList): void => {
    setShowConfirmDelete(true);
    setDeletedFilterList(filterList);
  };

  const debounceSearchFilters = debounce(() => getFilters(), 300);

  const searchFilters = (event): void => {
    setSearchTerm(event.target.value);
  };

  useEffect(() => {
    let message = `Are you sure you want to delete filter "${deletedFilterList.name}?"`;
    let title = `Delete filter ${deletedFilterList.id}`;
    if (isImported(deletedFilterList)) {
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
            <Badge variant="primary">Override</Badge>
          </Col>
        )}
        {isShared(props) && (
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
    if (isImported(props)) {
      return <FontAwesomeIcon icon={faEye as IconProp} />;
    }

    return <FontAwesomeIcon icon={faEdit as IconProp} />;
  };

  const CIDFilter = (): JSX.Element => {
    return (
      <div className={"card-container"}>
        {searchTerm && (
          <p>
            {filterLists ? filterLists.length : "0"} result
            {filterLists && filterLists.length === 1 ? "" : "s"} found
          </p>
        )}
        <TableContainer>
          <Table>
            <thead>
              <tr>
                <th>Bulk</th>
                <th>Filter name</th>
                <th>Scope</th>
                <th>Subscribers</th>
                <th># of CIDs</th>
                <th>
                  Active{" "}
                  <OverlayTrigger
                    placement="right"
                    delay={{ show: 150, hide: 300 }}
                    overlay={
                      <Tooltip id="button-tooltip">
                        Active filter lists prevent deals with included CIDs
                      </Tooltip>
                    }
                  >
                    <FontAwesomeIcon
                      icon={faQuestionCircle as IconProp}
                      color="#7393B3"
                      style={{
                        marginTop: 2,
                      }}
                    />
                  </OverlayTrigger>
                </th>
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
                      to={`/filters/edit/${filterList.shareId}`}
                      className="double-space-left"
                    >
                      {filterList.name}
                    </Link>
                  </td>
                  <td>
                    <CIDFilterScope {...filterList} />
                  </td>
                  <td>
                    {isImported(filterList) ||
                    isOrphan(filterList) ||
                    filterList.visibility !== Visibility.Public
                      ? "-"
                      : (filterList.provider_Filters || []).length - 1}
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
                          if (isShared(filterList)) {
                            setSelectedFilterList(filterList);
                            setShowConfirmEnabled(true);
                          } else {
                            toggleFilterEnabled(filterList);
                          }
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
                      to={`/filters/edit/${filterList.shareId}`}
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
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={dataCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
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

  const beginLocalBulkSetEnabled = (val: boolean): void => {
    if (val) {
      setShowConfirmEnableBulkAction(true);
      setConfirmEnableBulkActionMessage(
        `Are you sure you want to enable ${disabledSelectedFilters.length} items?`
      );
    } else {
      setShowConfirmDisableBulkAction(true);
      setConfirmDisableBulkActionMessage(
        `Are you sure you want to disable ${enabledSelectedFilters.length} items?`
      );
    }
  };

  const beginGlobalBulkSetEnabled = (val: boolean): void => {
    setBulkEnabled(val);
    setShowConfirmEnabled(true);
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

  const isImportEnabled = (): boolean => {
    return (
      configuration.bitscreen && configuration.import && !!account?.country
    );
  };

  return (
    <div>
      {loaded ? (
        configuration.bitscreen ? (
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
                        <Button
                          onClick={() => {
                            const sharedFilters =
                              disabledSelectedFilters.filter((x) =>
                                isShared(x)
                              );
                            if (sharedFilters.length > 0) {
                              beginGlobalBulkSetEnabled(true);
                            } else {
                              beginLocalBulkSetEnabled(true);
                            }
                          }}
                        >
                          Enable {disabledSelectedFilters.length}
                        </Button>
                      </Col>
                    )}

                    {!!enabledSelectedFilters.length && (
                      <Col>
                        <Button
                          onClick={() => {
                            const sharedFilters = enabledSelectedFilters.filter(
                              (x) => isShared(x)
                            );
                            if (sharedFilters.length > 0) {
                              beginGlobalBulkSetEnabled(false);
                            } else {
                              beginLocalBulkSetEnabled(false);
                            }
                          }}
                        >
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
                    variant="outline-primary"
                    disabled={!isImportEnabled()}
                    onClick={() => {
                      setShowImportFilter(true);
                    }}
                    className="double-space-left import-btn"
                  >
                    Import Filter
                  </Button>
                  {!isImportEnabled() && (
                    <p className="text-dim hidden-tip">
                      To activate importing, go to Settings and add country
                      data.
                    </p>
                  )}
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
                title={
                  bulkEnabled === undefined
                    ? "The selected filter is imported by other providers"
                    : "One or more filters are imported by other providers"
                }
                callback={toggleSharedFilterEnabled}
                closeCallback={() => {
                  setSelectedFilterList(FilterService.emptyFilterList());
                  setBulkEnabled(undefined);
                  setShowConfirmEnabled(false);
                }}
              />
            </Container>
          </div>
        ) : (
          <div>
            To activate filtering, go to{" "}
            <a style={{ fontSize: 16 }} href="/settings">
              Settings
            </a>{" "}
            and add a wallet.
          </div>
        )
      ) : null}
    </div>
  );
}

export default Filters;

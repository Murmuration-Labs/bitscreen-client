import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faEdit, faEye, faTrash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Checkbox,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  TextField,
} from "@material-ui/core";
import ClearIcon from "@material-ui/icons/ClearRounded";
import SearchIcon from "@material-ui/icons/Search";
import axios from "axios";
import _ from "lodash";
import debounce from "lodash.debounce";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Col,
  Container,
  FormCheck,
  Row,
  Table,
} from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import { serverUri } from "../../config";
import ApiService from "../../services/ApiService";
import * as AuthService from "../../services/AuthService";
import FilterService from "../../services/FilterService";
import { HeadCell } from "../Public/Interfaces";
import EnhancedTableHead from "./EnhancedTableHead";
import "./Filters.css";
import HoverableMenuItem from "./HoverableMenuItem";
import ImportFilterModal from "./ImportFilterModal";
import {
  BulkSelectedType,
  Config,
  EnabledOption,
  FilterList,
  Order,
  Visibility,
  VisibilityString,
} from "./Interfaces";
import ToggleEnabledFilterModal from "./ToggleEnabledFilterModal";
import { isDisabled, isEnabled, isImported, isOrphan, isShared } from "./utils";

interface MyFiltersTableData {
  name: string;
  scope: string;
  subs: string;
  cids: string;
  enabled: string;
  actions: string;
}

const headCells: HeadCell<MyFiltersTableData>[] = [
  { id: "name", label: "Name", numeric: false },
  { id: "scope", label: "Scope", numeric: false },
  { id: "subs", label: "# of Subs", numeric: true },
  { id: "cids", label: "# of Cids", numeric: true },
  { id: "enabled", label: "Active", numeric: false },
  { id: "actions", label: "Actions", numeric: false },
];

function Filters(): JSX.Element {
  /**
   * UTILS
   */

  // ----------------------- PAGINATION -----------------------
  const [dataCount, setDataCount] = React.useState<number>(0);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  // ----------------------- PAGINATION -----------------------

  // ----------------------- SORTING -----------------------
  const [mySort, setMySort] = React.useState("asc");
  const [mySortBy, setMySortBy] = React.useState("name");
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] =
    React.useState<keyof MyFiltersTableData>("name");
  const [needsRefresh, setNeedsRefresh] = useState(false);
  // ----------------------- SORTING -----------------------
  const [hoveredFilterId, setHoveredFilterId] = useState(-1);

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof MyFiltersTableData
  ) => {
    // if (property !== ) return;

    setMySort(mySort === "asc" ? "desc" : "asc");
    setOrder(mySort === "asc" ? "desc" : "asc");
    setMySortBy(property);
    setOrderBy(property);
  };

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
      const providerId = AuthService.getProviderId();
      const response = await axios.get(`${serverUri()}/config/${providerId}`);
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

  useEffect(() => {
    setNeedsRefresh(false);

    ApiService.getFilters(page, rowsPerPage, mySortBy, mySort, searchTerm).then(
      (data) => {
        const filterLists: FilterList[] = data.filters;

        setFilterLists(filterLists);
        setDataCount(data.count);
        setSelectedConditional(BulkSelectedType.None);

        setLoaded(true);
      }
    );
  }, [rowsPerPage, page, mySortBy, mySort, searchTerm, needsRefresh]);

  const deleteFilter = async (filter: FilterList) => {
    await ApiService.deleteFilter(filter);
    setNeedsRefresh(true);
  };

  const toggleFilterEnabled = async (filterList: FilterList): Promise<void> => {
    filterList.enabled = !filterList.enabled;
    await ApiService.updateFilter([filterList], false);
    setNeedsRefresh(true);
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
    setNeedsRefresh(true);
  };

  const confirmDelete = (filterList: FilterList): void => {
    setShowConfirmDelete(true);
    setDeletedFilterList(filterList);
  };

  const debounceSearchFilters = debounce(() => setNeedsRefresh(true), 300);

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
      [Visibility.Shareable]: "warning",
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
      return (
        <FontAwesomeIcon
          icon={faEye as IconProp}
          color={props.id === hoveredFilterId ? "blue" : "black"}
        />
      );
    }

    return (
      <FontAwesomeIcon
        icon={faEdit as IconProp}
        color={props.id === hoveredFilterId ? "blue" : "black"}
      />
    );
  };

  const CIDFilter = (): JSX.Element => {
    return (
      <div className={"card-container"}>
        <TableContainer>
          <Table aria-label="enhanced table">
            <EnhancedTableHead
              enableChecking
              checkedCount={filterLists.filter((f) => f.isBulkSelected).length}
              itemsCount={filterLists.length}
              headCells={headCells}
              order={order}
              orderBy={orderBy}
              mySort={mySort}
              mySortBy={mySortBy}
              onRequestSort={handleRequestSort}
              rowCount={dataCount}
            />
            <TableBody>
              {/* {stableSort(publicFiltersData, getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) */}
              {filterLists.map((row, index) => {
                return (
                  <TableRow
                    hover
                    onMouseEnter={() => setHoveredFilterId(row.id)}
                    onMouseLeave={() => setHoveredFilterId(-1)}
                    role="checkbox"
                    tabIndex={-1}
                    selected={!!row.isBulkSelected}
                    key={index}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={row.isBulkSelected}
                        onChange={() => {
                          row.isBulkSelected = !row.isBulkSelected;
                          setFilterLists([...filterLists]);
                        }}
                      />
                    </TableCell>
                    <TableCell style={{ verticalAlign: "middle" }}>
                      <Link
                        to={`/filters/edit/${row.shareId}`}
                        style={{
                          color: row.enabled ? "black" : "grey",
                          fontSize: 14,
                        }}
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell style={{ verticalAlign: "middle" }}>
                      <CIDFilterScope {...row} />
                    </TableCell>
                    <TableCell style={{ verticalAlign: "middle" }}>
                      {isImported(row) ||
                      isOrphan(row) ||
                      row.visibility !== Visibility.Public
                        ? "-"
                        : (row.provider_Filters || []).length - 1}
                    </TableCell>
                    <TableCell style={{ verticalAlign: "middle" }}>
                      <span
                        style={{
                          textAlign: "center",
                          color: "blue",
                          fontWeight: "bold",
                        }}
                      >
                        {row.cids && row.cids.length
                          ? row.cids.length
                          : row.cidsCount || 0}
                      </span>
                    </TableCell>
                    <TableCell style={{ verticalAlign: "middle" }}>
                      {!(
                        row.provider_Filters &&
                        !row.provider_Filters.some(
                          (pf) => pf.provider.id === row.provider.id
                        )
                      ) && (
                        <div
                          onClick={() => {
                            if (isShared(row)) {
                              setSelectedFilterList(row);
                              setShowConfirmEnabled(true);
                            } else {
                              toggleFilterEnabled(row);
                            }
                          }}
                        >
                          <FormCheck
                            readOnly
                            type="switch"
                            checked={row.enabled}
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell
                      align="right"
                      style={{ verticalAlign: "middle" }}
                    >
                      <Link
                        to={`/filters/edit/${row.shareId}`}
                        style={{ marginRight: 4 }}
                      >
                        {editOrEyeIcon(row)}
                      </Link>
                      <Link
                        to="#"
                        onClick={() => confirmDelete(row)}
                        style={{ marginRight: 4 }}
                      >
                        <FontAwesomeIcon
                          icon={faTrash as IconProp}
                          color={row.id === hoveredFilterId ? "red" : "black"}
                        />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* {emptyRows === 0 && (
                <TableRow>
                  <TableCell colSpan={6} />
                </TableRow>
              )} */}
            </TableBody>
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
      .finally(() => setNeedsRefresh(true));
  };

  const bulkSetEnabled = async (enabled: boolean) => {
    await ApiService.updateFilter(
      (enabled ? disabledSelectedFilters : enabledSelectedFilters).map((x) => ({
        ...x,
        enabled,
      })),
      false
    );

    setNeedsRefresh(true);
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  verticalAlign: "top",
                  paddingBottom: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    flex: 1,
                    alignItems: "center",
                  }}
                >
                  <h3>My Filters</h3>
                  <span
                    style={{
                      color: "grey",
                      fontStyle: "oblique",
                      marginLeft: 10,
                    }}
                  >
                    Filter lists running on my node
                    {!isImportEnabled() && (
                      <p className="text-dim" style={{ marginRight: 4 }}>
                        To activate importing, go to{" "}
                        <a style={{ fontSize: 12 }} href="/settings">
                          Settings
                        </a>{" "}
                        and add country data.
                      </p>
                    )}
                  </span>
                </div>
                <div>
                  <Button
                    variant="primary"
                    style={{ marginRight: 4 }}
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
                </div>
              </div>

              <Divider style={{ marginTop: 6, marginBottom: 10 }} />

              <div style={{ display: "flex", marginBottom: 10 }}>
                <div
                  style={{
                    display: "flex",
                    flex: 0.5,
                    marginRight: 4,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <TextField
                    style={{ width: "100%" }}
                    type="text"
                    placeholder="Search CID or Filter Name"
                    label="Search"
                    variant="outlined"
                    value={searchTerm}
                    onChange={searchFilters}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          {searchTerm && (
                            <IconButton
                              onClick={() => {
                                setSearchTerm("");
                              }}
                              color="default"
                            >
                              <ClearIcon />
                            </IconButton>
                          )}
                        </InputAdornment>
                      ),
                    }}
                    FormHelperTextProps={{ style: { fontSize: 12 } }}
                  />
                </div>
                <span
                  style={{
                    marginRight: 4,
                    flex: 1,
                    verticalAlign: "middle",
                    alignSelf: "center",
                  }}
                >
                  {filterLists ? filterLists.length : "0"} result
                  {filterLists && filterLists.length === 1 ? "" : "s"} found
                </span>
                <div style={{ marginRight: 4 }}>
                  <Select
                    style={{ minWidth: 100 }}
                    variant="outlined"
                    onChange={(e) => {
                      setSelectedConditional(
                        BulkSelectedType[e.target.value as string]
                      );
                    }}
                    value={BulkSelectedType[selectedConditional]}
                  >
                    {Object.keys(BulkSelectedType)
                      .filter((key) => isNaN(parseInt(key)))
                      .map((key, idx) => (
                        <MenuItem key={idx} value={key}>
                          {key}
                        </MenuItem>
                      ))}
                  </Select>
                </div>
                <div>
                  <Select
                    style={{ minWidth: 100 }}
                    disabled={
                      !disabledSelectedFilters.length &&
                      !enabledSelectedFilters.length &&
                      !orphanSelectedFilters.length
                    }
                    title={"Bulk Actions"}
                    variant="outlined"
                    defaultValue={"Bulk Actions"}
                    value={"Bulk Actions"}
                  >
                    <MenuItem value="Bulk Actions">Bulk Actions</MenuItem>
                    {!!disabledSelectedFilters.length && (
                      <HoverableMenuItem
                        type="default"
                        title={`Enable (${disabledSelectedFilters.length})`}
                        onClick={() => {
                          const sharedFilters = disabledSelectedFilters.filter(
                            (x) => isShared(x)
                          );
                          if (sharedFilters.length > 0) {
                            beginGlobalBulkSetEnabled(true);
                          } else {
                            beginLocalBulkSetEnabled(true);
                          }
                        }}
                      />
                    )}

                    {!!enabledSelectedFilters.length && (
                      <HoverableMenuItem
                        type="destructive"
                        title={`Disable (${enabledSelectedFilters.length})`}
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
                      />
                    )}

                    {!!orphanSelectedFilters.length && (
                      <HoverableMenuItem
                        type="destructive"
                        title={`Discard (${orphanSelectedFilters.length})`}
                        onClick={() => beginBulkDiscardOrphans()}
                      />
                    )}
                  </Select>
                </div>
              </div>

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
                    setNeedsRefresh(true);
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

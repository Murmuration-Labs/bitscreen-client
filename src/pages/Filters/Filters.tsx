import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faEdit,
  faEye,
  faQuestionCircle,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Checkbox,
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
} from '@material-ui/core';
import ClearIcon from '@material-ui/icons/ClearRounded';
import SearchIcon from '@material-ui/icons/Search';
import _ from 'lodash';
import debounce from 'lodash.debounce';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Col,
  FormCheck,
  OverlayTrigger,
  Row,
  Table,
  Tooltip,
} from 'react-bootstrap';
import { Link, useHistory } from 'react-router-dom';
import ConfirmModal from 'components/Modals/ConfirmModal/ConfirmModal';
import ApiService from 'services/ApiService';
import * as AuthService from 'services/AuthService';
import FilterService from 'services/FilterService';
import { HeadCell } from '../PublicFilters/Interfaces';
import EnhancedTableHead from './EnhancedTableHead/EnhancedTableHead';
import './Filters.css';
import HoverableMenuItem from './HoverableMenuItem/HoverableMenuItem';
import { ImportFilterModal } from '../../components/Modals/ImportFilterModal/ImportFilterModal';
import {
  BadgeColor,
  BulkSelectedType,
  Config,
  EnabledOption,
  FilterList,
  Order,
  Visibility,
  VisibilityString,
} from './Interfaces';
import ToggleEnabledFilterModal from './ToggleEnabledFilterModal/ToggleEnabledFilterModal';
import {
  isDisabled,
  isDisabledGlobally,
  isEnabled,
  isImported,
  isOrphan,
  isShared,
  itemsToPages,
} from './utils';
import LoggerService from 'services/LoggerService';
import MenuButton from '@material-ui/icons/MoreVert';
import DropdownMenu from './DropdownMenu/DropdownMenu';
import { toast } from 'react-toastify';
import { useTitle } from 'react-use';

interface MyFiltersTableData {
  name: string;
  scope: string;
  subs: string;
  cids: string;
  enabled: string;
  actions: string;
}

const headCells: HeadCell<MyFiltersTableData>[] = [
  { id: 'name', label: 'Filter name', numeric: false, sortable: true },
  { id: 'scope', label: 'Scope', numeric: false },
  { id: 'subs', label: '# of Subs', numeric: true, sortable: true },
  { id: 'cids', label: '# of Cids', numeric: true, sortable: true },
  {
    id: 'enabled',
    label: 'Active',
    numeric: false,
    sortable: true,
    info: (
      <OverlayTrigger
        placement="top"
        delay={{ show: 150, hide: 300 }}
        overlay={
          <Tooltip id="button-tooltip">
            Active filters run on your node to prevent deals with included CIDs
          </Tooltip>
        }
      >
        <FontAwesomeIcon
          icon={faQuestionCircle as IconProp}
          color="#7393B3"
          style={{
            marginLeft: 4,
          }}
        />
      </OverlayTrigger>
    ),
  },
  { id: 'actions', label: 'Actions', numeric: false },
];

function Filters(props): JSX.Element {
  useTitle('My Filters - BitScreen');
  /**
   * UTILS
   */

  // ----------------------- PAGINATION -----------------------
  const [dataCount, setDataCount] = React.useState<number>(0);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  // ----------------------- PAGINATION -----------------------

  // ----------------------- SORTING -----------------------
  const [mySort, setMySort] = React.useState('asc');
  const [mySortBy, setMySortBy] = React.useState('name');
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] =
    React.useState<keyof MyFiltersTableData>('name');
  const [needsRefresh, setNeedsRefresh] = useState(false);
  // ----------------------- SORTING -----------------------
  const [hoveredFilterId, setHoveredFilterId] = useState(-1);

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof MyFiltersTableData
  ) => {
    // if (property !== ) return;

    setMySort(mySort === 'asc' ? 'desc' : 'asc');
    setOrder(mySort === 'asc' ? 'desc' : 'asc');
    setMySortBy(property);
    setOrderBy(property);
  };

  const [enabledFilters, setEnabledFilters] = useState<FilterList[]>([]);
  const [disabledFilters, setDisabledFilters] = useState<FilterList[]>([]);
  const [orphanFilters, setOrphanFilters] = useState<FilterList[]>([]);
  const [ownedFilters, setOwnedFilters] = useState<FilterList[]>([]);

  const [enabledSelectedFilters, setEnabledSelectedFilters] = useState<
    FilterList[]
  >([]);
  const [disabledSelectedFilters, setDisabledSelectedFilters] = useState<
    FilterList[]
  >([]);
  const [selectedFilters, setSelectedFilters] = useState<FilterList[]>([]);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const [filterLists, setFilterLists] = useState<FilterList[]>([]);
  const [bulkCount, setBulkCount] = useState<{
    checkedCount: number;
    totalCount: number;
  }>({
    checkedCount: 0,
    totalCount: 0,
  });
  const [selectedConditional, setSelectedConditional] =
    useState<BulkSelectedType>(BulkSelectedType.None);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loaded, setLoaded] = useState<boolean>(false);
  const [showConfirmRemoveBulkAction, setShowConfirmRemoveBulkAction] =
    useState(false);
  const [confirmRemoveBulkActionMessage, setConfirmRemoveBulkActionMessage] =
    useState('');

  const translateVisibility = (visibility: Visibility): string => {
    return VisibilityString[visibility];
  };

  const [account, setAccount] = useState(AuthService.getAccount());
  const [configuration, setConfiguration] = useState<Config>({
    bitscreen: false,
    import: false,
    share: false,
  });

  const history = useHistory();

  useEffect(() => {
    LoggerService.info('Loading Filters List page.');
  }, []);

  useEffect(() => {
    setConfiguration({ ...props.config });
  }, [props.config]);

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
    setSelectedFilters(
      filterLists.filter(({ isBulkSelected }) => isBulkSelected)
    );
  }, [ownedFilters]);

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

      case BulkSelectedType.Exception:
        conditional = (x: FilterList) => x.visibility === Visibility.Exception;
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
      },
      (e) => {
        if (e && e.status === 401 && props.config) {
          toast.error(e.data.message);
          return;
        }
      }
    );
  }, [rowsPerPage, page, mySortBy, mySort, searchTerm, needsRefresh]);

  const deleteFilter = async (filter: FilterList) => {
    try {
      await ApiService.deleteFilter(filter);
    } catch (e: any) {
      if (e && e.status === 401 && props.config) {
        toast.error(e.data.message);
        return;
      }
    }
    setNeedsRefresh(true);
  };

  const toggleFilterEnabled = async (filterList: FilterList): Promise<void> => {
    filterList.enabled = !filterList.enabled;
    try {
      await ApiService.updateFilter([filterList], false);
    } catch (e: any) {
      if (e && e.status === 401 && props.config) {
        toast.error(e.data.message);
        return;
      }
    }
    setNeedsRefresh(true);
  };

  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('false');
  const [deletedFilterList, setDeletedFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );

  const [showConfirmEnableBulkAction, setShowConfirmEnableBulkAction] =
    useState<boolean>(false);
  const [confirmEnableBulkActionMessage, setConfirmEnableBulkActionMessage] =
    useState<string>('');

  const [showConfirmDisableBulkAction, setShowConfirmDisableBulkAction] =
    useState<boolean>(false);
  const [confirmDisableBulkActionMessage, setConfirmDisableBulkActionMessage] =
    useState<string>('');

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
      try {
        await ApiService.updateFilter(fls, false);
      } catch (e: any) {
        if (e && e.status === 401 && props.config) {
          toast.error(e.data.message);
          return;
        }
      }
    } else if (bulkEnabled === false) {
      const fls = enabledSelectedFilters.map((x) => {
        return {
          ...x,
          enabled: false,
        };
      });
      try {
        await ApiService.updateFilter(fls, false);
      } catch (e: any) {
        if (e && e.status === 401 && props.config) {
          toast.error(e.data.message);
          return;
        }
      }
    } else {
      const fl = {
        ...selectedFilterList,
        enabled: !selectedFilterList.enabled,
      };
      try {
        await ApiService.updateFilter([fl], false);
      } catch (e: any) {
        if (e && e.status === 401 && props.config) {
          toast.error(e.data.message);
          return;
        }
      }
    }
  };

  const toggleGlobalFilterEnabled = async (): Promise<void> => {
    if (bulkEnabled === true) {
      const ids = disabledSelectedFilters.map((x) => x.id);
      try {
        await ApiService.updateEnabledForSharedFilters(ids, true);
      } catch (e: any) {
        if (e && e.status === 401 && props.config) {
          toast.error(e.data.message);
          return;
        }
      }
    } else if (bulkEnabled === false) {
      const ids = enabledSelectedFilters.map((x) => x.id);
      try {
        await ApiService.updateEnabledForSharedFilters(ids, false);
      } catch (e: any) {
        if (e && e.status === 401 && props.config) {
          toast.error(e.data.message);
          return;
        }
      }
    } else {
      try {
        await ApiService.updateEnabledForSharedFilters(
          [selectedFilterList.id],
          !selectedFilterList.enabled
        );
      } catch (e: any) {
        if (e && e.status === 401 && props.config) {
          toast.error(e.data.message);
          return;
        }
      }
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
    let message;
    let title = `Delete filter`;
    if (isImported(deletedFilterList)) {
      message = `Are you sure you want to discard filter "${deletedFilterList.name}?"`;
      title = `Discard filter`;
    } else {
      const numberOfSubscribers =
        isImported(deletedFilterList) ||
        isOrphan(deletedFilterList) ||
        deletedFilterList.visibility !== Visibility.Public ||
        !deletedFilterList.provider_Filters
          ? 0
          : deletedFilterList.provider_Filters.length - 1;
      message = !numberOfSubscribers ? (
        `Are you sure you want to delete filter "${deletedFilterList.name}?"`
      ) : (
        <div className="multiple-rows-delete-message">
          <div style={{ marginBottom: '12px' }}>
            Deleting this list will impact {numberOfSubscribers}{' '}
            {numberOfSubscribers === 1 ? 'subscriber' : 'subscribers'}.
          </div>
          <div>Do you want to delete it anyway?</div>
        </div>
      );
    }
    setTitle(title);
    setMessage(message);
  }, [showConfirmDelete, deletedFilterList]);

  const CIDFilterScope = (props: FilterList): JSX.Element => {
    const variantMapper = {
      [Visibility.None]: 'secondary',
      [Visibility.Private]: 'danger',
      [Visibility.Public]: 'success',
      [Visibility.Shared]: 'warning',
    };
    const colorMapper = {
      [BadgeColor.None]: { backgroundColor: '#7A869A' },
      [BadgeColor.Private]: { backgroundColor: '#FC6471' },
      [BadgeColor.Public]: { backgroundColor: '#4DA74D' },
      [BadgeColor.Shared]: { backgroundColor: '#F7C143' },
      [BadgeColor.Imported]: { backgroundColor: '#7A869A' },
      [BadgeColor.Orphan]: {
        backgroundColor: '#FFFFFF',
        color: '#7A869A',
        border: '1px solid #7A869A',
      },
      [BadgeColor.Override]: { backgroundColor: '#027BFE' },
    };

    const isImported = props.provider.id !== AuthService.getProviderId();

    const orphan = isOrphan(props);

    const isException = props.visibility === Visibility.Exception;

    return (
      <Row style={{ display: 'flex', flexDirection: 'column' }}>
        <Col>
          <Badge style={{ color: '#FFFFFF', ...colorMapper[props.visibility] }}>
            {translateVisibility(props.visibility)}
          </Badge>
        </Col>
        {isException && (
          <Col>
            <Badge variant="primary">Exception</Badge>
          </Col>
        )}
        {isShared(props) && (
          <Col>
            <Badge style={colorMapper[BadgeColor.Shared]}>Shared</Badge>
          </Col>
        )}
        {isImported && (
          <Col>
            <Badge style={colorMapper[BadgeColor.Imported]}>Imported</Badge>
          </Col>
        )}
        {orphan && (
          <Col>
            <Badge style={colorMapper[BadgeColor.Orphan]}>Orphan</Badge>
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
          color={props.id === hoveredFilterId ? 'blue' : 'black'}
        />
      );
    }

    return (
      <FontAwesomeIcon
        icon={faEdit as IconProp}
        color={props.id === hoveredFilterId ? 'blue' : 'black'}
      />
    );
  };

  const handleMainCheckboxToggle = () => {
    if (bulkCount.checkedCount === 0) {
      const newFilterLists = filterLists.map((element) => ({
        ...element,
        isBulkSelected: true,
      }));
      setFilterLists(newFilterLists);
    } else {
      const newFilterLists = filterLists.map((element) => ({
        ...element,
        isBulkSelected: false,
      }));
      setFilterLists(newFilterLists);
    }
  };

  const CIDFilter = (): JSX.Element => {
    return (
      <div className={'card-container'}>
        <TableContainer>
          <Table aria-label="enhanced table">
            <EnhancedTableHead
              enableChecking
              checkedCount={bulkCount.checkedCount}
              itemsCount={bulkCount.totalCount}
              headCells={headCells}
              order={order}
              orderBy={orderBy}
              mySort={mySort}
              mySortBy={mySortBy}
              onRequestSort={handleRequestSort}
              rowCount={dataCount}
              onMainCheckboxToggle={handleMainCheckboxToggle}
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
                    <TableCell
                      className="table-row-cell-text"
                      padding="checkbox"
                    >
                      <Checkbox
                        checked={row.isBulkSelected}
                        onChange={() => {
                          row.isBulkSelected = !row.isBulkSelected;
                          setFilterLists([...filterLists]);
                        }}
                      />
                    </TableCell>
                    <TableCell
                      className="table-row-cell-text"
                      style={{ verticalAlign: 'middle', width: 400 }}
                    >
                      <Link
                        to={`/filters/edit/${row.shareId}`}
                        style={{
                          color: row.enabled ? 'black' : 'grey',
                          fontSize: 14,
                        }}
                      >
                        {row.name}
                      </Link>
                    </TableCell>
                    <TableCell
                      className="table-row-cell-text"
                      style={{ verticalAlign: 'middle' }}
                    >
                      <CIDFilterScope {...row} />
                    </TableCell>
                    <TableCell
                      className="table-row-cell-text"
                      style={{ verticalAlign: 'middle' }}
                    >
                      {isImported(row) ||
                      isOrphan(row) ||
                      row.visibility !== Visibility.Public ||
                      !row.provider_Filters
                        ? '-'
                        : row.provider_Filters.length - 1}
                    </TableCell>
                    <TableCell
                      className="table-row-cell-text"
                      style={{ verticalAlign: 'middle' }}
                    >
                      <span
                        style={{
                          textAlign: 'center',
                        }}
                      >
                        {row.cids && row.cids.length
                          ? row.cids.length
                          : row.cidsCount || 0}
                      </span>
                    </TableCell>
                    <TableCell
                      className="table-row-cell-text"
                      style={{ verticalAlign: 'middle' }}
                    >
                      <div
                        onClick={() => {
                          if (isShared(row)) {
                            setSelectedFilterList(row);
                            setShowConfirmEnabled(true);
                          } else if (
                            !isOrphan(row) &&
                            !isDisabledGlobally(row)
                          ) {
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
                    </TableCell>
                    <TableCell
                      align="right"
                      style={{ verticalAlign: 'middle' }}
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
                          color={row.id === hoveredFilterId ? 'red' : 'black'}
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
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={dataCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelDisplayedRows={itemsToPages(rowsPerPage)}
        />
      </div>
    );
  };

  useEffect(() => {
    debounceSearchFilters();
  }, [searchTerm]);

  const [showImportFilter, setShowImportFilter] = useState<boolean>(false);

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
    setOwnedFilters(filterLists.filter((f) => !isImported(f)));

    setBulkCount({
      checkedCount: filterLists.filter((f) => f.isBulkSelected).length,
      totalCount: filterLists.length,
    });
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

  const beginBulkDelete = () => {
    const filterCount = selectedFilters.length;
    let filterSubscriberCount = 0;
    for (const filter of selectedFilters) {
      if (!isImported(filter) && filter.provider_Filters) {
        filterSubscriberCount += filter.provider_Filters.length - 1;
      }
    }
    setShowConfirmRemoveBulkAction(true);
    if (filterSubscriberCount > 0) {
      setConfirmRemoveBulkActionMessage(
        `Removing these ${filterCount} list(s) will impact ${filterSubscriberCount} subscribers.`
      );
    } else {
      setConfirmRemoveBulkActionMessage(
        `Are you sure you want to remove ${ownedFilters.length} items?`
      );
    }
  };

  const bulkRemove = () => {
    Promise.all(selectedFilters.map((f) => ApiService.deleteFilter(f)))
      .then(() => {
        enqueueSnackbar('Successfully deleted all.', {
          variant: 'success',
          preventDuplicate: true,
          anchorOrigin: {
            horizontal: 'right',
            vertical: 'top',
          },
        });
      })
      .catch((e) => {
        if (e && e.status === 401 && props.config) {
          toast.error(e.data.message);
          return;
        }
        enqueueSnackbar('One or more filters could not be deleted.', {
          variant: 'error',
          preventDuplicate: true,
          anchorOrigin: {
            horizontal: 'right',
            vertical: 'top',
          },
        });
        LoggerService.error(e);
      })
      .finally(() => setNeedsRefresh(true));
  };

  const bulkSetEnabled = async (enabled: boolean) => {
    try {
      await ApiService.updateFilter(
        (enabled ? disabledSelectedFilters : enabledSelectedFilters).map(
          (x) => ({
            ...x,
            enabled,
          })
        ),
        false
      );
    } catch (e: any) {
      if (e && e.status === 401 && props.config) {
        toast.error(e.data.message);
        return;
      }
    }

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
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                verticalAlign: 'top',
                paddingBottom: 0,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flex: 1,
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: 32, fontWeight: 600, marginBottom: 0 }}>
                  My filters
                </div>
                <span className="page-subtitle">
                  Filter lists running on my node
                  {!isImportEnabled() && (
                    <p className="text-dim" style={{ marginRight: 4 }}>
                      To activate importing, go to{' '}
                      <a style={{ fontSize: 12 }} href="/settings">
                        Settings
                      </a>{' '}
                      and add country data.
                    </p>
                  )}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                }}
              >
                <Button
                  variant="primary"
                  style={{ marginRight: 4, backgroundColor: '#003BDD' }}
                  onClick={() => history.push(`/filters/new`)}
                >
                  New Filter
                </Button>

                <Button
                  variant="outline-primary"
                  style={{ marginRight: 4 }}
                  disabled={!isImportEnabled()}
                  onClick={() => {
                    setShowImportFilter(true);
                  }}
                  className="double-space-left import-btn"
                >
                  Import Filter
                </Button>
                <DropdownMenu
                  titleButton={
                    <IconButton size="small">
                      <MenuButton />
                    </IconButton>
                  }
                >
                  <MenuItem
                    onClick={async () => {
                      try {
                        ApiService.downloadCidList();
                      } catch (e: any) {
                        if (e && e.status === 401 && props.config) {
                          toast.error(e.data.message);
                          return;
                        }
                      }
                    }}
                  >
                    <Button
                      variant="outline-primary"
                      className="double-space-left import-btn"
                    >
                      Download CID List
                    </Button>
                  </MenuItem>
                </DropdownMenu>
              </div>
            </div>

            <div className="filters-page-search-bulk-actions">
              <div
                style={{
                  display: 'flex',
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <TextField
                  style={{ width: 480, marginRight: 12 }}
                  type="text"
                  placeholder="Search"
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
                              setSearchTerm('');
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
                {searchTerm ? (
                  <span
                    style={{
                      marginRight: 4,
                      verticalAlign: 'middle',
                      alignSelf: 'center',
                    }}
                  >
                    {filterLists ? filterLists.length : '0'} result
                    {filterLists && filterLists.length === 1 ? '' : 's'} found
                  </span>
                ) : (
                  <></>
                )}
              </div>
              <div style={{ marginRight: 12 }}>
                <span className="mr-2">Select</span>
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
                    !selectedFilters.length
                  }
                  title={'Bulk Actions'}
                  variant="outlined"
                  defaultValue={'Bulk Actions'}
                  value={'Bulk Actions'}
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

                  {!!selectedFilters.length && (
                    <HoverableMenuItem
                      type="destructive"
                      title={`Remove (${selectedFilters.length})`}
                      onClick={() => beginBulkDelete()}
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
              title={'Confirm bulk enable filters'}
              message={confirmEnableBulkActionMessage}
              callback={() => bulkSetEnabled(true)}
              closeCallback={() => {
                setShowConfirmEnableBulkAction(false);
                setConfirmEnableBulkActionMessage('');
              }}
            />
            <ConfirmModal
              show={showConfirmDisableBulkAction}
              title={'Confirm bulk disable filters'}
              message={confirmDisableBulkActionMessage}
              callback={() => bulkSetEnabled(false)}
              closeCallback={() => {
                setShowConfirmDisableBulkAction(false);
                setConfirmDisableBulkActionMessage('');
              }}
            />

            <ConfirmModal
              show={showConfirmRemoveBulkAction}
              title={'Confirm bulk remove filters'}
              message={confirmRemoveBulkActionMessage}
              callback={() => bulkRemove()}
              closeCallback={() => {
                setShowConfirmRemoveBulkAction(false);
                setConfirmRemoveBulkActionMessage('');
              }}
            />

            <ToggleEnabledFilterModal
              show={showConfirmEnabled}
              title={
                bulkEnabled === undefined
                  ? 'The selected filter is imported by other providers'
                  : 'One or more filters are imported by other providers'
              }
              callback={toggleSharedFilterEnabled}
              closeCallback={() => {
                setSelectedFilterList(FilterService.emptyFilterList());
                setBulkEnabled(undefined);
                setShowConfirmEnabled(false);
              }}
            />
          </div>
        ) : (
          <div>
            To activate filtering, go to{' '}
            <a style={{ fontSize: 16 }} href="/settings">
              Settings
            </a>{' '}
            and add a wallet.
          </div>
        )
      ) : null}
    </div>
  );
}

export default Filters;

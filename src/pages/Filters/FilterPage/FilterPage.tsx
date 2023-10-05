import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faExternalLinkAlt,
  faFolderPlus,
  faLink,
  faPlusCircle,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Checkbox,
  FormControl,
  IconButton,
  Input,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
} from '@material-ui/core';
import MenuButton from '@material-ui/icons/MoreVert';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import ConfirmModal from 'components/Modals/ConfirmModal/ConfirmModal';
import PageTitle from 'components/Utils/PageTitle';
import _ from 'lodash';
import { CID } from 'multiformats';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  Badge,
  Button,
  Col,
  Dropdown,
  DropdownButton,
  Form,
  OverlayTrigger,
  Row,
  Tooltip,
} from 'react-bootstrap';
import { Prompt } from 'react-router';
import { useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApiService from 'services/ApiService';
import * as AuthService from 'services/AuthService';
import FilterService from 'services/FilterService';
import LoggerService from 'services/LoggerService';
import ConflictModal from '../../../components/Modals/ConflictModal/ConflictModal';
import AddCidBatchModal from '../AddCidBatchModal/AddCidBatchModal';
import AddCidModal from '../AddCidModal/AddCidModal';
import CidsTable from '../CidsTable/CidsTable';
import DropdownMenu from '../DropdownMenu/DropdownMenu';
import '../Filters.css';
import {
  CidItem,
  Config,
  Conflict,
  EnabledOption,
  FilterList,
  NetworkType,
  ViewTypes,
  Visibility,
} from '../Interfaces';
import MoveCIDModal from '../MoveCIDModal/MoveCIDModal';
import ToggleEnabledFilterModal from '../ToggleEnabledFilterModal/ToggleEnabledFilterModal';
import { isDisabledGlobally, isOrphan, isShared } from '../utils';
import { abbreviateNetwork } from 'library/helpers/helpers.functions';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const FilterPage = (props): JSX.Element => {
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const [cids, setCids] = useState<CidItem[]>([]);
  const [checkedCids, setCheckedCids] = useState<CidItem[]>([]);
  const [isBulkActionAllowed, setIsBulkActionAllowed] = useState(false);
  const [isCidBulkEdit, setIsCidBulkEdit] = useState(false);
  const [filterList, setFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );
  const [showConfirmEnabled, setShowConfirmEnabled] = useState<boolean>(false);
  const [deferGlobalFilterEnabled, setDeferGlobalFilterEnabled] =
    useState<boolean>(false);
  const [filterEnabled, setFilterEnabled] = useState(filterList.enabled);
  const [isOwner, setIsOwner] = useState(false);
  const [filterNotes, setFilterNotes] = useState<string | undefined>(undefined);
  const [initialFilterNotes, setInitialFilterNotes] = useState<
    string | undefined
  >(undefined);

  const [account, setAccount] = useState(AuthService.getAccount());
  const [configuration, setConfiguration] = useState<Config>({
    bitscreen: false,
    import: false,
    share: false,
  });
  const [showConflict, setShowConflict] = useState<{
    single: boolean;
    multiple: boolean;
  }>({
    single: false,
    multiple: false,
  });
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [totalConflicts, setTotalConflicts] = useState<Conflict[]>([]);
  const [conflictsChanged, setConflictsChanged] = useState<boolean>(false);
  const [cidsValid, setCidsValid] = useState<boolean>(true);

  const addConflicts = (conflicts: Conflict[]) => {
    setTotalConflicts((prevConflicts) => prevConflicts.concat(conflicts));
  };

  const removeConflict = (cid: string) => {
    setTotalConflicts((prevConflicts) =>
      prevConflicts.filter((c) => c.cid !== cid)
    );
    setConflictsChanged((prevState) => !prevState);
  };

  const showConflictsModal = () => {
    setConflicts(totalConflicts);
    setShowConflict({
      single: false,
      multiple: true,
    });
  };

  useEffect(() => LoggerService.info('Loading Filter Details page.'), []);

  useEffect(() => {
    setConfiguration(props.config);
  }, [props.config]);

  useEffect(() => {
    for (const cid of filterList.cids) {
      try {
        CID.parse(cid.cid);
      } catch (e) {
        setCidsValid(false);
        return;
      }
    }

    setCidsValid(true);
  }, [filterList.cids]);

  const isAccountInfoValid = (): boolean => {
    return account
      ? !!account.address &&
          !!account.businessName &&
          !!account.contactPerson &&
          !!account.email &&
          !!account.website &&
          !!account.country
      : false;
  };

  const isShareEnabled = (): boolean => {
    return (
      configuration &&
      configuration.bitscreen &&
      configuration.share &&
      isAccountInfoValid()
    );
  };

  const clipboardCopy = (linkToBeCopied, successMessage = '') => {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = linkToBeCopied;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    toast.success(successMessage ?? 'The link was copied succesfully');
  };

  const visibilityGenerateLink = (): JSX.Element => {
    let generatedLink = '';

    if (
      [Visibility.Public, Visibility.Shared].includes(filterList.visibility)
    ) {
      generatedLink = `${window.location.protocol}/${window.location.host}/directory/details/${filterList.shareId}`;
    } else {
      return <></>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Button
          size="sm"
          className={'text-dim'}
          style={{ color: 'blue', fontSize: 14, marginLeft: -16 }}
          onClick={() => {
            clipboardCopy(generatedLink, 'The link was copied successfully.');
          }}
          variant="muted"
        >
          Copy Link
          <FontAwesomeIcon size="sm" icon={faLink as IconProp} />
        </Button>
        <Button
          size="sm"
          className={'text-dim'}
          style={{ color: 'blue', fontSize: 14, marginLeft: -16 }}
          onClick={() => {
            clipboardCopy(
              filterList.shareId,
              'The ID was copied successfully.'
            );
          }}
          variant="muted"
        >
          Copy ID
          <FontAwesomeIcon size="sm" icon={faLink as IconProp} />
        </Button>
      </div>
    );
  };

  useEffect(() => {
    setCids(
      filterList &&
        filterList.cids &&
        typeof filterList.cids !== 'number' &&
        filterList.cids.length
        ? filterList.cids.sort((a, b) => {
            if (a.id && b.id) {
              return a.id - b.id;
            }

            return !a.id ? (!b.id ? 0 : b.id) : a.id;
          })
        : []
    );
    setFilterEnabled(filterList.enabled);
  }, [filterList]);

  useEffect(() => {
    setCheckedCids(
      cids && cids.length ? cids.filter(({ isChecked }) => isChecked) : []
    );
  }, [cids]);

  useEffect(() => {
    setIsBulkActionAllowed(!!checkedCids && !!checkedCids.length);
  }, [checkedCids]);

  const [editingCid, setEditingCid] = useState<CidItem | null>(null);
  const [editingCidIndex, setEditingCidIndex] = useState<number>(-1);
  const [editingCidType, setEditingCidType] = useState<'EDIT' | 'ADD' | null>(
    null
  );
  const [loaded, setLoaded] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isImported, setIsimported] = useState<boolean>(false);
  const [addCidBatchModal, setAddCidBatchModal] = useState<boolean>(false);
  const [showDiscardOrphan, setShowDiscardOrphan] = useState<boolean>(false);
  const [showDiscardDisabled, setShowDiscardDisabled] =
    useState<boolean>(false);

  const [invalidFilterId, setInvalidFilterId] = useState<boolean>(false);

  const [moveToFilterList, setMoveToFilterList] = useState<
    FilterList | undefined
  >(undefined);
  const [initialFilterList, setInitialFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );
  const [filterListChanged, setFilterListChanged] = useState<boolean>(false);
  const history = useHistory();

  useEffect(() => {
    if (isOrphan(filterList)) {
      setShowDiscardOrphan(true);
    }

    if (isDisabledGlobally(filterList)) {
      setShowDiscardDisabled(true);
    }

    if (!filterList.provider_Filters) {
      return;
    }

    const result = filterList.provider_Filters
      ? filterList.provider_Filters.filter(
          ({ provider }) => provider.id === AuthService.getProviderId()
        )[0]
      : null;

    setFilterNotes(result?.notes);
    setInitialFilterNotes(result?.notes);
  }, [loaded]);

  useEffect(() => {
    setFilterListChanged(!_.isEqual(filterNotes, initialFilterNotes));
  }, [filterNotes, initialFilterNotes]);

  const generateUniqueKey = (): string => {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
  };

  const mountedRef = useRef(true);
  const initFilter = (shareId: string): void => {
    if (shareId) {
      setIsEdit(true);
      ApiService.getFilter(shareId).then(
        (filterList: FilterList) => {
          if (!mountedRef.current) return;
          if (!filterList) {
            setInvalidFilterId(true);
            return;
          }

          const cidItems =
            filterList.cids && filterList.cids.length
              ? filterList.cids.map((cid: CidItem) => {
                  return { ...cid, tableKey: generateUniqueKey() };
                })
              : [];
          const fl = {
            ...filterList,
            cids: cidItems,
          };

          const owner =
            !fl.provider || fl.provider.id === AuthService.getProviderId();
          setIsOwner(owner);
          setIsimported(!owner);
          setFilterList(fl);
          setInitialFilterList({ ...fl });
          setLoaded(true);
          setFilterEnabled(fl.enabled);
        },
        (e) => {
          if (e && e.status === 401 && props.config) {
            toast.error(e.data.message);
            return;
          }
        }
      );
    } else {
      setLoaded(true);
    }
  };

  useEffect(() => {
    void initFilter(props.match.params.shareId as string);

    return () => {
      mountedRef.current = false;
    };
  }, [props.match.params.shareId]);

  useEffect(() => {
    setFilterListChanged(!_.isEqual(filterList, initialFilterList));
  }, [filterList, initialFilterList]);

  const initBeforeUnLoad = (confirmReload) => {
    window.onbeforeunload = (event) => {
      if (confirmReload) {
        const e = event || window.event;
        e.preventDefault();
        if (e) {
          e.returnValue = '';
        }
        return '';
      }
    };
  };

  useEffect(() => {
    initBeforeUnLoad(filterListChanged);
  }, [filterListChanged]);

  const saveFilter = (fl?: FilterList) => {
    if (!fl) {
      fl = filterList;
    }

    setFilterList(fl);
  };

  const [deleteCidItems, setDeleteCidItems] = useState<CidItem[]>([]);

  const save = async () => {
    const fl: FilterList = { ...filterList, notes: filterNotes };
    if (isEdit) {
      const filtersToUpdate = [fl];
      if (moveToFilterList) {
        filtersToUpdate.push(moveToFilterList);
      }
      try {
        await ApiService.updateFilter(filtersToUpdate);
        if (deleteCidItems.length) {
          await ApiService.removeCidsFromFilter(deleteCidItems, filterList.id);
        }
        if (deferGlobalFilterEnabled) {
          await ApiService.updateEnabledForSharedFilters(
            [filterList.id],
            filterList.enabled
          );
        }
        setFilterListChanged(false); // To prevent unsaved data prompt.
        history.push(`/filters`);
        toast.success('Filter list updated successfully');
      } catch (e: any) {
        if (e && e.data && e.data.message && props.config) {
          toast.error(e.data.message);
          LoggerService.error(e);
        }
      }
    } else {
      try {
        await ApiService.addFilter(fl);
        setFilterListChanged(false); // To prevent unsaved data prompt.
        history.push(`/filters`);
        toast.success('Filter list created successfully');
      } catch (e: any) {
        if (e && e.data && e.data.message && props.config) {
          toast.error(e.data.message);
          LoggerService.error(e);
        }
      }
    }
  };

  const cancel = async (): Promise<void> => {
    setFilterListChanged(false);
    history.push(`/filters`);
  };

  const changeName = (event: React.ChangeEvent<HTMLInputElement>): void => {
    event.preventDefault();
    saveFilter({ ...filterList, name: event.target.value });
  };

  const changeVisibility = (visibility: Visibility): void => {
    saveFilter({
      ...filterList,
      visibility,
    });
  };

  const getVisibilityButtonClass = (): string => {
    switch (filterList.visibility) {
      case Visibility.Private:
        return 'visibility-private';
      case Visibility.Public:
        return 'visibility-public';
      case Visibility.Shared:
        return 'visibility-shared';
      case Visibility.Exception:
        return 'visibility-exception';
    }

    return '';
  };

  const onNewCid = (): void => {
    const newCid: CidItem = {
      tableKey: generateUniqueKey(),
      cid: '',
      refUrl: '',
      edit: true,
      isChecked: false,
      isSaved: false,
    };

    setEditingCid(newCid);
    setEditingCidType('ADD');
    setEditingCidIndex(-1);
  };

  const onNewCidsBatch = (cidsBatch, refUrl): void => {
    const cids: CidItem[] = cidsBatch.map((element: string) => ({
      tableKey: generateUniqueKey(),
      cid: element,
      refUrl,
      edit: false,
      isChecked: false,
      isSaved: false,
    }));

    saveFilter({ ...filterList, cids: [...filterList.cids, ...cids] });
  };

  const onEditCidsBatch = (refUrl: string): void => {
    saveFilter({
      ...filterList,
      cids: cids.map((cid) =>
        cid.isChecked
          ? { ...cid, isChecked: false, refUrl }
          : { ...cid, isChecked: false }
      ),
    });
  };

  const [showDeleteItemsModal, setShowDeleteItemsModal] =
    useState<boolean>(false);

  const deleteItems = () => {
    const items = filterList.cids.filter(
      (item: CidItem) => !deleteCidItems.includes(item)
    );

    saveFilter({
      ...filterList,
      cids: items,
    });

    toast.info("Don't forget to press Save Changes to save the changes.");
  };

  const removeCid = (index: number) => {
    const cidsCopy = [...cids];
    cidsCopy.splice(index, 1);
    setDeleteCidItems([...deleteCidItems, cids[index]]);

    saveFilter({
      ...filterList,
      cids: cidsCopy,
    });
  };

  const prepareCidDeleteModal = (itemsToDelete: CidItem[]) => {
    setDeleteCidItems([...deleteCidItems, ...itemsToDelete]);
    setShowDeleteItemsModal(true);
  };

  const [showMoveModal, setShowMoveModal] = useState<boolean>(false);
  const [moveCidItems, setMoveCidItems] = useState<CidItem[]>([]);
  const [moveOptionFilters, setMoveOptionFilters] = useState<FilterList[]>([]);

  const prepareCidEditModal = (editItems: CidItem[]) => {
    if (editItems.length > 1) {
      return;
    }

    const cid = editItems[0];
    setEditingCid(cid);
    setEditingCidType('EDIT');
    setEditingCidIndex(cids.indexOf(cid));
  };

  const prepareCidMoveModal = async (moveItems: CidItem[]): Promise<void> => {
    let data;
    try {
      data = await ApiService.getFilters(0, 100, 'asc', 'name', '');
    } catch (e: any) {
      if (e && e.status === 401 && props.config) {
        toast.error(e.data.message);
        return;
      }
    }
    const filterLists: FilterList[] = data.filters;
    const providerId = AuthService.getProviderId();

    setMoveCidItems(moveItems.filter((x) => typeof x.id === 'number'));
    setMoveOptionFilters(
      filterLists.filter(
        (x) => x.id !== filterList.id && x.provider.id == providerId
      )
    );
    setShowMoveModal(true);
  };

  const handleBulkEditCids = (): void => {
    const items = filterList.cids.map((item: CidItem) => {
      return item.isChecked ? { ...item, isChecked: true } : item;
    });
    const fl = {
      ...filterList,
      cids: items,
    };

    setIsCidBulkEdit(true);
    saveFilter(fl);
  };

  const handleBulkMoveCids = (): void => {
    prepareCidMoveModal(checkedCids);
  };

  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('false');
  const [deletedFilterList, setDeletedFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );

  const confirmDelete = (): void => {
    setShowConfirmDelete(true);
    setDeletedFilterList(filterList);
  };

  useEffect(() => {
    const title = isImported ? `Discard filter` : `Delete filter`;
    const message = isImported
      ? `Are you sure you want to discard filter "${filterList.name}?"`
      : `Are you sure you want to delete filter "${filterList.name}?"`;
    setTitle(title);
    setMessage(message);
  }, [showConfirmDelete, deletedFilterList]);

  const deleteCurrentFilter = async (): Promise<void> => {
    ApiService.deleteFilter(filterList).then(
      () => {
        toast.success(
          isImported
            ? 'Filter list discarded successfully'
            : 'Filter list deleted successfully'
        );
        history.push('/filters');
      },
      (e) => {
        if (e && e.status === 401 && props.config) {
          toast.error(e.data.message);
          return;
        }
      }
    );
  };

  useEffect(() => {
    console.log(filterList.networks);
  }, [filterList.networks]);

  const toggleFilterEnabled = () => {
    saveFilter({ ...filterList, enabled: !filterList.enabled });
  };

  const toggleSharedFilterEnabled = async (
    option: EnabledOption
  ): Promise<void> => {
    if (option === EnabledOption.Global) {
      setDeferGlobalFilterEnabled(true);
      toggleFilterEnabled();
    } else if (option === EnabledOption.Local) {
      toggleFilterEnabled();
    }
  };

  const closeModalCallback = () => {
    setShowMoveModal(false);
  };

  const move = async (
    items: CidItem[],
    selectedFilter: FilterList
  ): Promise<void> => {
    const selectedFilterWithCids = await ApiService.getFilter(
      selectedFilter.shareId
    );
    selectedFilterWithCids.cids = [...selectedFilterWithCids.cids, ...items];
    setMoveToFilterList(selectedFilterWithCids);

    filterList.cids = filterList.cids.filter((x) => !items.includes(x));

    saveFilter({ ...filterList });
    toast.info("Don't forget to press Save Changes to save the changes.");
  };

  const checkViewType = (): ViewTypes => {
    switch (true) {
      case isEdit:
        switch (true) {
          case isOwner:
            return ViewTypes.Edit;
          default:
            return ViewTypes.Imported;
        }
      default:
        return ViewTypes.New;
    }
  };

  const getStatusTooltip = (
    isOrphan: boolean | undefined,
    isDeactivatedGlobally: boolean | undefined
  ) => {
    switch (true) {
      case isOrphan:
        return (
          <Tooltip id="button-tooltip">
            List deleted by owner. Cannot be activated
          </Tooltip>
        );
      case isDeactivatedGlobally:
        return (
          <Tooltip id="button-tooltip">
            List deactivated by owner. Cannot be activated.
          </Tooltip>
        );
      default:
        return (
          <Tooltip id="button-tooltip">
            Active filters run on your node to prevent deals with included CIDs
          </Tooltip>
        );
    }
  };

  const visibilityHelpText = () => {
    let text = '';

    switch (filterList.visibility) {
      case Visibility.Private:
        text = 'Private lists are only visible to you.';
        break;
      case Visibility.Public:
        text = 'Public lists are visible to all users via the directory.';
        break;
      case Visibility.Shared:
        text =
          'Shared lists are only visible to other users if they have the URL or ID. Please save the filter to generate the shareable URL.';
        break;
      case Visibility.Exception:
        text =
          'Exception lists prevent CIDs from imported lists from being filtered. Cannot be shared.';
        break;
    }

    return <Tooltip id="button-tooltip">{text}</Tooltip>;
  };

  const renderToggleButtonGroup = () => {
    return (
      <>
        <OverlayTrigger
          placement="top"
          delay={{ show: 150, hide: 300 }}
          overlay={getStatusTooltip(
            isOrphan(filterList),
            isDisabledGlobally(filterList)
          )}
        >
          <FontAwesomeIcon
            icon={faQuestionCircle as IconProp}
            color="#7393B3"
            style={{
              marginRight: 4,
            }}
          />
        </OverlayTrigger>
        <ToggleButtonGroup
          color="primary"
          exclusive
          size="small"
          value={filterEnabled}
        >
          <ToggleButton
            value={false}
            disabled={!filterEnabled}
            style={
              !filterEnabled
                ? {
                    backgroundColor: '#FB6471',
                    color: 'white',
                  }
                : {}
            }
            color="primary"
            onClick={() => {
              if (!isOrphan(filterList)) {
                if (isShared(filterList)) {
                  setShowConfirmEnabled(true);
                } else {
                  saveFilter({ ...filterList, enabled: false });
                }
              }
            }}
          >
            Inactive
          </ToggleButton>
          <ToggleButton
            value={true}
            style={
              filterEnabled
                ? {
                    backgroundColor: '#003BDD',
                    color: 'white',
                  }
                : {}
            }
            disabled={filterEnabled}
            onClick={() => {
              if (!isOrphan(filterList) && !isDisabledGlobally(filterList)) {
                if (isShared(filterList)) {
                  setShowConfirmEnabled(true);
                } else {
                  saveFilter({ ...filterList, enabled: true });
                }
              }
            }}
          >
            Active
          </ToggleButton>
        </ToggleButtonGroup>
      </>
    );
  };

  const renderTitle = (): JSX.Element => {
    const backButton = (
      <div
        onClick={cancel}
        style={{
          marginRight: '17px',
          fontSize: '36px',
          lineHeight: '36px',
          textAlign: 'center',
          fontWeight: 200,
          color: '#7A869A',
          cursor: 'pointer',
        }}
      >
        &#8249;
      </div>
    );
    let title;
    if (isImported) {
      title = (
        <div
          style={{
            display: 'flex',
            alignContent: 'center',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexWrap: 'nowrap',
            flexDirection: 'row',
          }}
        >
          <PageTitle title="View filter list - BitScreen" />
          <div className="filter-page-title">
            View filter list{' '}
            <Badge variant={isOrphan(filterList) ? 'danger' : 'dark'}>
              {isOrphan(filterList) ? 'Orphaned' : 'Imported'}
            </Badge>
          </div>
          {isOrphan(filterList) && (
            <span className="page-subtitle">
              This list was deleted by the owner.
            </span>
          )}
          {isDisabledGlobally(filterList) && (
            <span className="page-subtitle">
              This list was deactivated by the owner.
            </span>
          )}
        </div>
      );
    } else if (isEdit) {
      title = (
        <div
          style={{
            display: 'flex',
            alignContent: 'center',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexWrap: 'nowrap',
            flexDirection: 'row',
          }}
        >
          <PageTitle title={`Edit ${filterList.name} - BitScreen`} />
          <div className="filter-page-title">Edit filter list</div>
          <span className="page-subtitle">
            Make changes to {filterList.name} (
            {filterList.provider_Filters
              ? filterList.provider_Filters?.length
              : 'No'}{' '}
            active subscribers)
          </span>
        </div>
      );
    } else {
      title = (
        <>
          <PageTitle title="New filter list - BitScreen" />
          <div className="filter-page-title">New filter list</div>
        </>
      );
    }

    return (
      <div className="d-flex">
        {backButton}
        {title}
      </div>
    );
  };

  const renderOrigin = (): JSX.Element => {
    if (isOwner || !isImported) {
      return <></>;
    }

    return (
      <div style={{ display: 'flex', paddingBottom: 4, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <h4>Origin</h4>
          <a
            href={`/directory/details/${filterList.shareId}`}
            className="origin-link"
            target="_blank"
          >
            {window.location.protocol}//
            {window.location.host}/directory/details/{filterList.shareId}
            <FontAwesomeIcon
              icon={faExternalLinkAlt as IconProp}
              className="space-left"
            />
          </a>
        </div>
        <div>{renderToggleButtonGroup()}</div>
      </div>
    );
  };

  const renderNotes = (): JSX.Element => {
    if (isOwner || !isImported) {
      return <></>;
    }

    return (
      <Form.Row>
        <Col>
          <h4>Notes (local)</h4>
          <Form.Control
            role="notes"
            onChange={(ev: ChangeEvent<HTMLInputElement>) => {
              setFilterNotes(ev.target.value);
            }}
            as="textarea"
            placeholder="This note can only be seen by you."
            value={filterNotes || ''}
          />
        </Col>
      </Form.Row>
    );
  };

  if (invalidFilterId) {
    return (
      <Row>
        <h2>Invalid Filter ID</h2>
      </Row>
    );
  }

  const renderDeleteButton = (): JSX.Element => {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        {totalConflicts.length === 0 && (
          <Button
            variant="primary"
            style={{ marginRight: isEdit ? 5 : 0, backgroundColor: '#003BDD' }}
            disabled={!filterListChanged || !cidsValid}
            onClick={save}
          >
            Save Changes
          </Button>
        )}
        {totalConflicts.length > 0 && (
          <Button
            variant="primary"
            style={{ marginRight: isEdit ? 5 : 0, backgroundColor: '#003BDD' }}
            onClick={showConflictsModal}
          >
            Resolve Conflicts
          </Button>
        )}
        {isEdit && (
          <DropdownMenu
            titleButton={
              <IconButton size="small">
                <MenuButton />
              </IconButton>
            }
          >
            <MenuItem
              onClick={() => {
                confirmDelete();
              }}
            >
              <Button variant="outline-danger" style={{ width: '100%' }}>
                {isImported ? 'Discard' : 'Delete'}
              </Button>
            </MenuItem>
          </DropdownMenu>
        )}
        {/*  */}
      </div>
    );
  };

  const handleNetworkTypeChange = (networkType: NetworkType) => {
    setFilterList((fl) => {
      const currentNetworkListCopy = fl.networks.slice();
      const networkTypeIndex = currentNetworkListCopy.findIndex(
        (e) => e === networkType
      );
      if (networkTypeIndex !== -1)
        currentNetworkListCopy.splice(networkTypeIndex, 1);
      else currentNetworkListCopy.push(networkType);
      return {
        ...fl,
        networks: currentNetworkListCopy,
      };
    });
  };

  return (
    <>
      {loaded ? (
        <>
          <div style={{ display: 'flex', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>{renderTitle()}</div>
            {renderDeleteButton()}
          </div>

          <Row>
            <Col>
              <div>
                <div className="d-flex mb-3">
                  <Col className="d-flex flex-column pl-0">
                    <div className="filter-page-input-label">Filter Name</div>
                    <Form.Control
                      role="name"
                      onChange={changeName}
                      type="text"
                      placeholder="Filter Name..."
                      value={filterList.name}
                      disabled={isImported}
                    />
                  </Col>
                  <Col className="d-flex flex-column pr-0">
                    <div className="filter-page-input-label">
                      List Description
                    </div>
                    <Form.Control
                      role="description"
                      onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                        ev.preventDefault();

                        saveFilter({
                          ...filterList,
                          description: ev.target.value,
                        });
                      }}
                      as="textarea"
                      rows={1}
                      placeholder="List Description..."
                      value={filterList.description}
                      disabled={isImported}
                    />
                  </Col>
                </div>
                {/* {!isShareEnabled() && (
                    <Form.Row style={{ marginTop: -10, marginLeft: -2 }}>
                      <Col>
                        <Form.Label className={"text-dim"}>
                          To activate sharing, go to{" "}
                          <a style={{ fontSize: 12 }} href="/settings">
                            Settings
                          </a>{" "}
                          and add list provider data.
                        </Form.Label>
                      </Col>
                    </Form.Row>
                  )} */}
                {renderOrigin()}
                {renderNotes()}
                {checkViewType() !== ViewTypes.Imported && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                        alignContent: 'center',
                        alignItems: 'center',
                        marginBottom: 10,
                      }}
                    >
                      <DropdownButton
                        menuAlign="left"
                        title="Add CID"
                        className="add-cid-button"
                      >
                        <Dropdown.Item>
                          <Button
                            variant="outline-secondary"
                            style={{
                              width: '100%',
                            }}
                            onClick={onNewCid}
                            disabled={isImported}
                          >
                            <div>
                              Single
                              <FontAwesomeIcon
                                icon={faPlusCircle as IconProp}
                              />
                            </div>
                          </Button>
                        </Dropdown.Item>
                        <Dropdown.Item>
                          <Button
                            variant="outline-secondary"
                            style={{ width: '100%' }}
                            onClick={() => {
                              setAddCidBatchModal(true);
                            }}
                            disabled={isImported}
                          >
                            <div>
                              Bulk
                              <FontAwesomeIcon
                                icon={faFolderPlus as IconProp}
                              />
                            </div>
                          </Button>
                        </Dropdown.Item>
                      </DropdownButton>
                      <DropdownButton
                        variant="outline-secondary"
                        menuAlign="left"
                        title="Bulk actions"
                        className="bulk-actions-button"
                        disabled={!isBulkActionAllowed}
                      >
                        <Dropdown.Item>
                          <Button
                            variant="outline-primary"
                            className="bulk-actions-edit"
                            onClick={handleBulkEditCids}
                            disabled={!isBulkActionAllowed}
                          >
                            Edit
                          </Button>
                        </Dropdown.Item>
                        {checkViewType() === ViewTypes.Edit &&
                          filterList.visibility !== Visibility.Exception && (
                            <Dropdown.Item>
                              <Button
                                variant="outline-warning"
                                className="bulk-actions-move"
                                onClick={handleBulkMoveCids}
                                disabled={!isBulkActionAllowed}
                              >
                                Move
                              </Button>
                            </Dropdown.Item>
                          )}
                        <Dropdown.Item>
                          <Button
                            variant="outline-danger"
                            className="bulk-actions-delete"
                            onClick={() => {
                              const items = cids.filter(
                                (item: CidItem) => item.isChecked
                              );
                              prepareCidDeleteModal(items);
                            }}
                            disabled={!isBulkActionAllowed}
                          >
                            Delete
                          </Button>
                        </Dropdown.Item>
                      </DropdownButton>
                      {(isOwner || !isImported) && (
                        <div className="sharing-section d-flex justify-content-between">
                          <div className="d-flex align-items-center">
                            <div
                              style={{
                                position: 'relative',
                              }}
                            >
                              <div
                                onClick={(e) =>
                                  setNetworkDropdownOpen((prev) => !prev)
                                }
                                className="networks-button mr-2 no-text-select"
                                style={{
                                  cursor: 'pointer',
                                  height: '40px',
                                  width: '120px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  fontSize: '14px',
                                  padding: '0.375rem 0.75rem',
                                  border: '1px solid #6c757da6',
                                  borderRadius: '0.25rem',
                                  color: filterList.networks.length
                                    ? '#7A869A'
                                    : '#6c757da6',
                                }}
                              >
                                {filterList.networks.length
                                  ? `${filterList.networks
                                      .sort()
                                      .map((e, index) => {
                                        return index === 0
                                          ? abbreviateNetwork(e)
                                          : ' ' + abbreviateNetwork(e);
                                      })}`
                                  : 'Networks'}
                              </div>
                              <div
                                className="no-text-select"
                                style={{
                                  position: 'absolute',
                                  bottom: `-${
                                    Object.keys(NetworkType).length * 20 +
                                    (Object.keys(NetworkType).length - 1) * 12 +
                                    24
                                  }px`,
                                  left: '-2px',
                                  padding: '10px 0',
                                  display: networkDropdownOpen
                                    ? 'flex'
                                    : 'none',
                                  flexDirection: 'column',
                                  gap: '12px',
                                  minWidth: '160px',
                                  border: '1px solid rgba(0,0,0,.15)',
                                  zIndex: 99,
                                  borderRadius: '0.25rem',
                                  backgroundColor: 'white',
                                }}
                              >
                                {Object.keys(NetworkType).map((networkType) => (
                                  <div
                                    onClick={() =>
                                      handleNetworkTypeChange(
                                        NetworkType[networkType]
                                      )
                                    }
                                    style={{
                                      height: '20px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Checkbox
                                      color="primary"
                                      checked={
                                        filterList.networks.findIndex(
                                          (filterListNetworkType) =>
                                            filterListNetworkType ===
                                            networkType
                                        ) !== -1
                                      }
                                      // checked={network}
                                    />
                                    <span
                                      style={{
                                        fontWeight: 400,
                                        fontSize: '14px',
                                        lineHeight: '20px',
                                      }}
                                    >
                                      {networkType}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="filter-page-input-label mr-2">
                              Type:
                            </div>
                            <DropdownButton
                              variant="outline-secondary"
                              menuAlign="left"
                              className={`sharing-button ${getVisibilityButtonClass()}`}
                              title={Visibility[filterList.visibility]}
                            >
                              {isShareEnabled() && (
                                <Dropdown.Item
                                  onClick={() =>
                                    changeVisibility(Visibility.Public)
                                  }
                                >
                                  <Button
                                    className="sharing-button-public"
                                    variant="outline-secondary"
                                  >
                                    Public
                                  </Button>
                                </Dropdown.Item>
                              )}
                              {isShareEnabled() && (
                                <Dropdown.Item
                                  onClick={() =>
                                    changeVisibility(Visibility.Shared)
                                  }
                                >
                                  <Button
                                    className="sharing-button-shared"
                                    variant="outline-secondary"
                                  >
                                    Shared
                                  </Button>
                                </Dropdown.Item>
                              )}
                              <Dropdown.Item
                                onClick={() =>
                                  changeVisibility(Visibility.Private)
                                }
                              >
                                <Button
                                  className="sharing-button-private"
                                  variant="outline-secondary"
                                >
                                  Private
                                </Button>
                              </Dropdown.Item>
                              <Dropdown.Item
                                onClick={() =>
                                  changeVisibility(Visibility.Exception)
                                }
                              >
                                <Button
                                  className="sharing-button-exception"
                                  variant="outline-secondary"
                                >
                                  Exception
                                </Button>
                              </Dropdown.Item>
                            </DropdownButton>
                            <OverlayTrigger
                              placement="top"
                              delay={{ show: 150, hide: 300 }}
                              overlay={visibilityHelpText()}
                            >
                              <FontAwesomeIcon
                                icon={faQuestionCircle as IconProp}
                                color="#7393B3"
                                style={{
                                  marginRight: 4,
                                }}
                              />
                            </OverlayTrigger>

                            {filterList.shareId && visibilityGenerateLink()}
                          </div>

                          <div className="d-flex align-items-center">
                            {renderToggleButtonGroup()}
                          </div>
                        </div>
                      )}
                    </div>
                    <div
                      className="cids-table-container"
                      style={{ marginBottom: 10 }}
                    >
                      <CidsTable
                        filter={filterList}
                        cids={cids}
                        checkedCids={checkedCids}
                        onMainCheckboxToggle={() => {
                          saveFilter({
                            ...filterList,
                            cids: cids.map((cid) => ({
                              ...cid,
                              isChecked:
                                checkedCids.length === 0 ||
                                (checkedCids.length > 0 &&
                                  checkedCids.length < cids.length)
                                  ? true
                                  : false,
                            })),
                          });
                        }}
                        onCheckboxToggle={(index) => {
                          saveFilter({
                            ...filterList,
                            cids: cids.map((item, idx) =>
                              idx === index
                                ? {
                                    ...item,
                                    isChecked: !item.isChecked,
                                  }
                                : { ...item }
                            ),
                          });
                        }}
                        onEditClick={(index) =>
                          prepareCidEditModal([cids[index]])
                        }
                        onMoveClick={(index) =>
                          prepareCidMoveModal([cids[index]])
                        }
                        onDeleteClick={(index) => removeCid(index)}
                        setConflict={setConflicts}
                        totalConflicts={totalConflicts}
                        setShowConflict={setShowConflict}
                        addConflicts={addConflicts}
                        removeConflict={removeConflict}
                        conflictsChanged={conflictsChanged}
                      ></CidsTable>
                    </div>
                  </div>
                )}
              </div>
            </Col>
          </Row>
          {editingCid && open && (
            <AddCidModal
              cid={editingCid as CidItem}
              index={editingCidIndex}
              open={!!editingCidType}
              edit={editingCidType === 'EDIT'}
              handleClose={(cid, idx) => {
                if (
                  cid &&
                  filterList.cids.map((e) => e.cid).includes(cid.cid)
                ) {
                  toast.error(
                    'The same CID cannot be added to a filter list more than once.'
                  );
                  return;
                }
                setEditingCid(null);
                setEditingCidType(null);
                setEditingCidIndex(-1);

                if (!cid && idx === undefined) {
                  return;
                }

                if (cid && idx === -1) {
                  saveFilter({
                    ...filterList,
                    cids: [...cids, { ...cid }],
                  });
                  return;
                }

                if (cid && idx !== undefined && idx >= 0) {
                  saveFilter({
                    ...filterList,
                    cids: cids.map((_cid, _idx) =>
                      _idx === idx ? { ...cid } : { ..._cid }
                    ),
                  });
                }
              }}
            />
          )}
          <MoveCIDModal
            cidItems={moveCidItems}
            optionFilters={moveOptionFilters}
            move={move}
            closeCallback={closeModalCallback}
            show={showMoveModal}
          />
          <ConflictModal
            showConflict={showConflict}
            conflicts={conflicts}
            setShowConflict={setShowConflict}
            removeConflict={removeConflict}
          />
          {addCidBatchModal && (
            <AddCidBatchModal
              closeCallback={async (data) => {
                if (!data || !data.result || !data.result.length) {
                  return setAddCidBatchModal(false);
                }
                for (let i = 0; i < data?.result.length; i++) {
                  if (
                    filterList.cids.map((e) => e.cid).includes(data?.result[i])
                  ) {
                    toast.error(
                      'The same CID cannot be added to a filter list more than once.'
                    );
                    return;
                  }
                }
                setAddCidBatchModal(false);

                onNewCidsBatch(data.result, data.refUrl);
              }}
              show={addCidBatchModal}
            />
          )}
          {isCidBulkEdit && (
            <AddCidBatchModal
              closeCallback={async (data) => {
                setIsCidBulkEdit(false);
                if (!data) {
                  return;
                }

                onEditCidsBatch(data.refUrl);
              }}
              edit={true}
              show={!!checkedCids && !!checkedCids.length && isCidBulkEdit}
            />
          )}
          <Prompt
            when={filterListChanged}
            message={(location, action) => {
              if (location.state) {
                const { tokenExpired } = location.state as {
                  tokenExpired: boolean;
                };
                if (tokenExpired) {
                  return true;
                }
              }
              setFilterListChanged(true);
              return 'You have unsaved changes, are you sure you want to leave?';
            }}
          />
          <ConfirmModal
            show={showConfirmDelete}
            title={title}
            message={message}
            callback={() => deleteCurrentFilter()}
            closeCallback={() => {
              setDeletedFilterList(FilterService.emptyFilterList());
              setShowConfirmDelete(false);
            }}
          />
          <ConfirmModal
            show={showDeleteItemsModal}
            title="Confirm removal of selected CIDs"
            message="Are you sure you want to delete the selected items?"
            callback={() => {
              deleteItems();
            }}
            closeCallback={() => {
              setShowDeleteItemsModal(false);
            }}
          />
          <ConfirmModal
            show={showDiscardOrphan}
            title="Orphaned filter list"
            message="This list was deleted by the owner. Do you want to discard it?"
            callback={() => deleteCurrentFilter()}
            confirmMessage="Yes"
            declineMessage="No"
            closeCallback={() => {
              setDeletedFilterList(FilterService.emptyFilterList());
              setShowDiscardOrphan(false);
            }}
          />
          <ConfirmModal
            show={showDiscardDisabled}
            title="Inactive filter list"
            message="This list was deactivated by the owner. Do you want to discard it?"
            callback={() => deleteCurrentFilter()}
            confirmMessage="Yes"
            declineMessage="No"
            closeCallback={() => {
              setDeletedFilterList(FilterService.emptyFilterList());
              setShowDiscardDisabled(false);
            }}
          />

          <ToggleEnabledFilterModal
            show={showConfirmEnabled}
            title="The selected filter is imported by other providers"
            callback={toggleSharedFilterEnabled}
            closeCallback={() => {
              setShowConfirmEnabled(false);
            }}
          />
        </>
      ) : null}
    </>
  );
};

export default FilterPage;

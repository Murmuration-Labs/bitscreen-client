import { IconProp } from "@fortawesome/fontawesome-svg-core";
import MenuButton from "@material-ui/icons/MoreVert";
import {
  faExternalLinkAlt,
  faFolderPlus,
  faLink,
  faPlusCircle,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import _ from "lodash";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
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
} from "react-bootstrap";
import DropdownMenu from "./DropdownMenu";
import { Prompt } from "react-router";
import { useHistory } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import { serverUri } from "../../config";
import ApiService from "../../services/ApiService";
import * as AuthService from "../../services/AuthService";
import FilterService from "../../services/FilterService";
import AddCidBatchModal from "./AddCidBatchModal";
import AddCidModal from "./AddCidModal";
import CidsTable from "./Cids/CidsTable";
import "./Filters.css";
import {
  CidItem,
  Config,
  EnabledOption,
  FilterList,
  ViewTypes,
  Visibility,
} from "./Interfaces";
import MoveCIDModal from "./MoveCIDModal";
import ToggleEnabledFilterModal from "./ToggleEnabledFilterModal";
import { isOrphan, isShared } from "./utils";
import { IconButton, MenuItem } from "@material-ui/core";

const FilterPage = (props): JSX.Element => {
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

  useEffect(() => {
    setConfiguration(props.config);
  }, [props.config]);

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

  const clipboardCopy = (linkToBeCopied) => {
    const selBox = document.createElement("textarea");
    selBox.style.position = "fixed";
    selBox.style.left = "0";
    selBox.style.top = "0";
    selBox.style.opacity = "0";
    selBox.value = linkToBeCopied;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
    toast.success("The link was copied succesfully");
  };

  const visibilityHelpText = (): string => {
    let text = "";

    switch (filterList.visibility) {
      case Visibility.Private:
        text = "Private lists are only visible to you.";
        break;
      case Visibility.Public:
        text = "Public lists are visible to all users via the directory.";
        break;
      case Visibility.Shared:
        text =
          "Shared lists are only visible to other users if they have the URL.";
        break;
      case Visibility.Exception:
        text =
          "Exception lists prevent CIDs from imported lists from being filtered. Cannot be shared.";
        break;
    }

    if (text) {
      return `(${text})`;
    }

    return "";
  };

  const visibilityGenerateLink = (): JSX.Element => {
    if (
      filterList.visibility !== Visibility.Public &&
      filterList.visibility !== Visibility.Shared
    ) {
      return <></>;
    }

    let generatedLink = "";
    let buttonText = "";

    if (filterList.visibility === Visibility.Public) {
      generatedLink = `${window.location.protocol}//${window.location.host}/directory/details/${filterList.shareId}`;
      buttonText = "Copy Link ";
    } else if (filterList.visibility === Visibility.Shared) {
      generatedLink = serverUri() + "/filter/share/" + filterList.shareId;
      buttonText = "Copy Link ";
    }

    return (
      <Button
        size="sm"
        className={"text-dim"}
        style={{ color: "blue", fontSize: 14, marginLeft: -16 }}
        onClick={() => {
          clipboardCopy(generatedLink);
        }}
        variant="muted"
      >
        {buttonText}
        <FontAwesomeIcon size="sm" icon={faLink as IconProp} />
      </Button>
    );
  };

  useEffect(() => {
    setCids(
      filterList &&
        filterList.cids &&
        typeof filterList.cids !== "number" &&
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
  const [editingCidType, setEditingCidType] = useState<"EDIT" | "ADD" | null>(
    null
  );
  const [loaded, setLoaded] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isImported, setIsimported] = useState<boolean>(false);
  const [addCidBatchModal, setAddCidBatchModal] = useState<boolean>(false);

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
    return "_" + Math.random().toString(36).substr(2, 9);
  };

  const mountedRef = useRef(true);
  const initFilter = (shareId: string): void => {
    if (shareId) {
      setIsEdit(true);
      ApiService.getFilter(shareId).then((filterList: FilterList) => {
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
      });
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
          e.returnValue = "";
        }
        return "";
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

  const updateGlobalFilterEnabled = (): void => {
    ApiService.updateEnabledForSharedFilters(
      [filterList.id],
      filterList.enabled
    );
  };

  const save = (): void => {
    const fl: FilterList = { ...filterList, notes: filterNotes };
    if (isEdit) {
      setLoaded(true);
      const filtersToUpdate = [fl];
      if (moveToFilterList) {
        filtersToUpdate.push(moveToFilterList);
      }
      ApiService.updateFilter(filtersToUpdate)
        .then(() => {
          ApiService.deleteCid(deleteCidItems)
            .then(() => {
              if (deferGlobalFilterEnabled) {
                updateGlobalFilterEnabled();
              }
              setFilterListChanged(false); // To prevent unsaved data prompt.
              history.push(`/filters`);
              toast.success("Filter list updated successfully");
              setLoaded(false);
            })
            .catch((err) => {
              toast.error("Error: " + err.message);
              setLoaded(false);
            });
        })
        .catch((err) => {
          toast.error("Error: " + err.message);
          setLoaded(false);
        });
    } else {
      ApiService.addFilter(fl)
        .then(() => {
          setFilterListChanged(false); // To prevent unsaved data prompt.
          history.push(`/filters`);
          toast.success("Filter list created successfully");
          setLoaded(false);
        })
        .catch((err) => {
          toast.error("Error: " + err.message);
          setLoaded(false);
        });
    }
  };

  const [showOverrideCids, setShowOverrideCids] = useState<boolean>(false);
  const [overrideCidsTitle, setOverrideCidsTitle] = useState<string>("");
  const [overrrideCidsMessage, setOverrrideCidsMessage] =
    useState<string>("false");
  const [overrideCidsBullets, setOverrideCidsBullets] = useState<string[]>([]);

  const canSave = (): void => {
    ApiService.getOverrideCids(filterList)
      .then((res) => {
        if (Object.keys(res).length > 0) {
          setOverrideCidsTitle("Local filter cids exception warning");
          setOverrrideCidsMessage(
            "The following cids are present on local filter lists:"
          );
          setOverrideCidsBullets(res);
          setShowOverrideCids(true);
        } else {
          save();
        }
      })
      .catch(() => {
        toast.error("Something wrong happend please try again later.");
      });
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
        return "visibility-private";
      case Visibility.Public:
        return "visibility-public";
      case Visibility.Shared:
        return "visibility-shared";
      case Visibility.Exception:
        return "visibility-exception";
    }

    return "";
  };

  const onNewCid = (): void => {
    const newCid: CidItem = {
      tableKey: generateUniqueKey(),
      cid: "",
      refUrl: "",
      edit: true,
      isChecked: false,
      isSaved: false,
    };

    setEditingCid(newCid);
    setEditingCidType("ADD");
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
    setEditingCidType("EDIT");
    setEditingCidIndex(cids.indexOf(cid));
  };

  const prepareCidMoveModal = async (moveItems: CidItem[]): Promise<void> => {
    const data = await ApiService.getFilters(0, 100, "asc", "name", "");
    const filterLists: FilterList[] = data.filters;

    setMoveCidItems(moveItems);
    setMoveOptionFilters(
      filterLists.filter((x) => x.id !== filterList.id && isOwner)
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
  const [title, setTitle] = useState<string>("");
  const [message, setMessage] = useState<string>("false");
  const [deletedFilterList, setDeletedFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );

  const confirmDelete = (): void => {
    setShowConfirmDelete(true);
    setDeletedFilterList(filterList);
  };

  useEffect(() => {
    const title = isImported
      ? `Discard filter ${filterList.id}`
      : `Delete filter ${filterList.id}`;
    const message = isImported
      ? `Are you sure you want to discard filter "${filterList.name}?"`
      : `Are you sure you want to delete filter "${filterList.name}?"`;
    setTitle(title);
    setMessage(message);
  }, [showConfirmDelete, deletedFilterList]);

  const deleteCurrentFilter = async (): Promise<void> => {
    ApiService.deleteFilter(filterList).then(() => {
      toast.success(
        isImported
          ? "Filter list discarded successfully"
          : "Filter list deleted successfully"
      );
      history.push("/filters");
    });
  };

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
    selectedFilter.cids = [...selectedFilter.cids, ...items];
    setMoveToFilterList(selectedFilter);

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
  const renderToggleButtonGroup = () => {
    return (
      <>
        <OverlayTrigger
          placement="top"
          delay={{ show: 150, hide: 300 }}
          overlay={
            <Tooltip id="button-tooltip">
              Active filters run on your node to prevent deals with included
              CIDs
            </Tooltip>
          }
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
                    backgroundColor: "#FB6471",
                    color: "white",
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
                    backgroundColor: "#003BDD",
                    color: "white",
                  }
                : {}
            }
            disabled={filterEnabled}
            onClick={() => {
              if (!isOrphan(filterList)) {
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
          marginRight: "17px",
          fontSize: "36px",
          lineHeight: "36px",
          textAlign: "center",
          fontWeight: 200,
          color: "#7A869A",
          cursor: "pointer",
        }}
      >
        &#8249;
      </div>
    );
    let title;
    if (isImported) {
      title = (
        <div className="filter-page-title">
          View filter list <Badge variant="dark">Imported</Badge>
        </div>
      );
    } else if (isEdit) {
      title = (
        <div
          style={{
            display: "flex",
            alignContent: "center",
            justifyContent: "flex-start",
            alignItems: "center",
            flexWrap: "nowrap",
            flexDirection: "row",
          }}
        >
          <div className="filter-page-title">Edit filter list</div>
          <span
            style={{
              color: "grey",
              marginLeft: 12,
            }}
          >
            Make changes to {filterList.name} (
            {filterList.provider_Filters
              ? filterList.provider_Filters?.length
              : "No"}{" "}
            active subscribers)
          </span>
        </div>
      );
    } else {
      title = <div className="filter-page-title">New filter list</div>;
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
      <div style={{ display: "flex", paddingBottom: 4, alignItems: "center" }}>
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
            value={filterNotes || ""}
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
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <Button
          variant="primary"
          style={{ marginRight: isEdit ? 5 : 0, backgroundColor: "#003BDD" }}
          disabled={!filterListChanged}
          onClick={save}
        >
          Save Changes
        </Button>
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
              <Button variant="outline-danger" style={{ width: "100%" }}>
                {isImported ? "Discard" : "Delete"}
              </Button>
            </MenuItem>
          </DropdownMenu>
        )}
        {/*  */}
      </div>
    );
  };

  const renderCancelButton = (): JSX.Element => {
    return (
      <Col>
        <Button
          variant="secondary"
          style={{ marginBottom: 5, marginLeft: 5 }}
          onClick={cancel}
        >
          Cancel
        </Button>
      </Col>
    );
  };

  return (
    <>
      {loaded ? (
        <>
          <div style={{ display: "flex", marginBottom: "16px" }}>
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
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                        alignContent: "center",
                        alignItems: "center",
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
                              width: "100%",
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
                            style={{ width: "100%" }}
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
                        <div className="sharing-section">
                          <div className="filter-page-input-label mr-2">
                            Sharing:
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
                          {visibilityGenerateLink()}
                          <span
                            style={{
                              color: "grey",
                              fontSize: 12,
                              flex: 1,
                            }}
                          >
                            {visibilityHelpText()}
                          </span>
                          {renderToggleButtonGroup()}
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
              edit={editingCidType === "EDIT"}
              handleClose={(cid, idx) => {
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
          {addCidBatchModal && (
            <AddCidBatchModal
              closeCallback={async (data) => {
                setAddCidBatchModal(false);
                if (!data || !data.result || !data.result.length) {
                  return;
                }

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
            message="You have unsaved changes, are you sure you want to leave?"
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
            show={showOverrideCids}
            title={overrideCidsTitle}
            message={overrrideCidsMessage}
            bullets={overrideCidsBullets}
            callback={save}
            closeCallback={() => {
              setShowOverrideCids(false);
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

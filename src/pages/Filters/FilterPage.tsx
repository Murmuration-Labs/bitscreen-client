import { IconProp } from "@fortawesome/fontawesome-svg-core";
import MenuButton from "@material-ui/icons/MoreVert";
import {
  faEdit,
  faExternalLinkAlt,
  faFolderPlus,
  faLink,
  faPlusCircle,
  faQuestionCircle,
  faShare,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ToggleButton, ToggleButtonGroup } from "@material-ui/lab";
import axios from "axios";
import _ from "lodash";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  Badge,
  Button,
  Col,
  Container,
  Dropdown,
  DropdownButton,
  Form,
  FormCheck,
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
  mapVisibilityString,
  ViewTypes,
  Visibility,
  VisibilityString,
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
  const [filterOverride, setFilterOverride] = useState(filterList.override);
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
    async function setInitialConfig() {
      const providerId = AuthService.getProviderId();
      const response = await axios.get(`${serverUri()}/config/${providerId}`);
      const config = response.data;

      setConfiguration(config);
    }

    setInitialConfig();
  }, []);

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
      configuration.bitscreen && configuration.share && isAccountInfoValid()
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
    if (filterList.visibility === Visibility.Private)
      return "Private lists are only visible to you.";
    if (filterList.visibility === Visibility.Public)
      return "Public lists are visible to all in the directory and can be imported by any user.";
    if (filterList.visibility === Visibility.Shareable)
      return "Shareable lists can only be imported by other nodes if they have the shareable URL.";
    return "";
  };

  const visibilityGenerateLink = (): JSX.Element => {
    if (
      filterList.visibility !== Visibility.Public &&
      filterList.visibility !== Visibility.Shareable
    ) {
      return <></>;
    }

    let generatedLink = "";
    let buttonText = "";

    if (filterList.visibility === Visibility.Public) {
      generatedLink = `${window.location.protocol}//${window.location.host}/directory/details/${filterList.shareId}`;
      buttonText = "Copy Link ";
    } else if (filterList.visibility === Visibility.Shareable) {
      generatedLink = serverUri() + "/filter/share/" + filterList.shareId;
      buttonText = "Copy Link ";
    }

    return (
      <Button
        size="sm"
        className={"text-dim"}
        style={{ color: "blue" }}
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
    setFilterOverride(filterList.override);
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
        setFilterOverride(fl.override);
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
          setOverrideCidsTitle("Local filter cids override warning");
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

  const changeVisibility = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    event.preventDefault();
    const fl = {
      ...filterList,
      visibility: mapVisibilityString(event.target.value),
    };
    saveFilter(fl);
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

    toast.info("Don't forget to press Save to save the changes.");
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

  const toggleFilterOverride = () => {
    filterList.override = !filterList.override;
    setFilterOverride(filterList.override);

    const fl = {
      ...filterList,
      visibility: filterList.override
        ? Visibility.Private
        : initialFilterList.visibility,
    };
    saveFilter(fl);
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
    toast.info("Don't forget to press Save to save the changes.");
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
                  backgroundColor: "#137BFE",
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
    );
  };

  const renderTitle = (): JSX.Element => {
    if (isImported) {
      return (
        <h2>
          View Filter List &nbsp;<Badge variant="dark">Imported</Badge>
        </h2>
      );
    }

    if (isEdit) {
      return (
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
          <h2>Edit filter list</h2>
          &nbsp; &nbsp;
          <span
            style={{
              color: "grey",
              fontStyle: "oblique",
              marginLeft: 10,
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
    }

    return <h2>New filter list</h2>;
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
      <Container>
        <Row>
          <h2>Invalid Filter ID</h2>
        </Row>
      </Container>
    );
  }

  const renderDeleteButton = (props: FilterList): JSX.Element => {
    if (!isEdit) {
      return <></>;
    }

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
          style={{ marginRight: 5 }}
          disabled={!filterListChanged}
          onClick={save}
        >
          Save
        </Button>
        <DropdownMenu
          titleButton={
            <IconButton size="small">
              <MenuButton />
            </IconButton>
          }
        >
          {isOwner && !isImported && (
            <MenuItem
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
              onClick={() => toggleFilterOverride()}
            >
              <FormCheck readOnly type="switch" checked={filterOverride} />
              <Form.Label
                style={{
                  marginRight: 10,
                  marginTop: 2,
                }}
                className={"text-dim"}
              >
                Override{" "}
                <OverlayTrigger
                  placement="right"
                  delay={{ show: 150, hide: 300 }}
                  overlay={
                    <Tooltip id="button-tooltip">
                      Override lists prevent CIDs on imported lists from being
                      filtered. Override lists cannot be shared.
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
              </Form.Label>
            </MenuItem>
          )}
          <MenuItem
            onClick={() => {
              confirmDelete();
            }}
          >
            <Button variant="danger" style={{ width: "100%" }}>
              {isImported ? "Discard" : "Delete"}
            </Button>
          </MenuItem>
        </DropdownMenu>
        {/*  */}
      </div>
    );
  };

  const renderCancelButton = (props: FilterList): JSX.Element => {
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
          <Container>
            <div style={{ display: "flex" }}>
              <div style={{ flex: 1 }}>{renderTitle()}</div>
              {renderDeleteButton(filterList)}
            </div>

            <Row>
              <Col>
                <div>
                  <Form.Row>
                    <Col>
                      <Form.Control
                        role="name"
                        onChange={changeName}
                        type="text"
                        placeholder="List Name"
                        value={filterList.name}
                        disabled={isImported}
                      />
                    </Col>
                    <Col>
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
                        placeholder="List Description"
                        value={filterList.description}
                        disabled={isImported}
                      />
                    </Col>
                  </Form.Row>
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
                          style={{
                            margin: "0 1rem 0 0",
                          }}
                        >
                          <Dropdown.Item>
                            <Button
                              style={{
                                width: "100%",
                              }}
                              onClick={onNewCid}
                              disabled={isImported}
                            >
                              <FontAwesomeIcon
                                icon={faPlusCircle as IconProp}
                              />
                              &nbsp;Single
                            </Button>
                          </Dropdown.Item>
                          <Dropdown.Item>
                            <Button
                              style={{ width: "100%" }}
                              onClick={() => {
                                setAddCidBatchModal(true);
                              }}
                              disabled={isImported}
                            >
                              <FontAwesomeIcon
                                icon={faFolderPlus as IconProp}
                              />
                              &nbsp;Bulk
                            </Button>
                          </Dropdown.Item>
                        </DropdownButton>
                        <DropdownButton
                          menuAlign="left"
                          title="Bulk Actions"
                          style={{
                            margin: "0 1rem 0 0",
                          }}
                          disabled={!isBulkActionAllowed}
                        >
                          <Dropdown.Item>
                            <Button
                              variant="outline-primary"
                              style={{ width: "100%" }}
                              onClick={handleBulkEditCids}
                              disabled={!isBulkActionAllowed}
                            >
                              {/* <FontAwesomeIcon icon={faEdit as IconProp} /> */}
                              Edit
                            </Button>
                          </Dropdown.Item>
                          {checkViewType() === ViewTypes.Edit && (
                            <Dropdown.Item>
                              <Button
                                variant="outline-warning"
                                style={{ width: "100%" }}
                                onClick={handleBulkMoveCids}
                                disabled={!isBulkActionAllowed}
                              >
                                {/* <FontAwesomeIcon icon={faShare as IconProp} /> */}
                                Move
                              </Button>
                            </Dropdown.Item>
                          )}
                          <Dropdown.Item>
                            <Button
                              variant="outline-danger"
                              style={{ width: "100%" }}
                              onClick={() => {
                                const items = cids.filter(
                                  (item: CidItem) => item.isChecked
                                );
                                prepareCidDeleteModal(items);
                              }}
                              disabled={!isBulkActionAllowed}
                            >
                              {/* <FontAwesomeIcon icon={faTrash as IconProp} /> */}
                              Delete
                            </Button>
                          </Dropdown.Item>
                        </DropdownButton>
                        {(isOwner || !isImported) && (
                          <div
                            style={{
                              display: "flex",
                              flex: 1,
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <span>Sharing:</span>
                            <Form.Group
                              controlId="visibility"
                              style={{
                                marginBottom: "auto",
                                paddingLeft: 10,
                              }}
                            >
                              <Form.Control
                                as="select"
                                disabled={filterOverride}
                                onChange={changeVisibility}
                                value={VisibilityString[filterList.visibility]}
                              >
                                {isShareEnabled() && <option>Public</option>}
                                {isShareEnabled() && <option>Shareable</option>}
                                <option>Private</option>
                              </Form.Control>
                            </Form.Group>
                            <span
                              style={{
                                color: "grey",
                                fontStyle: "oblique",
                                marginLeft: 10,
                                fontSize: 13,
                              }}
                            >
                              {visibilityGenerateLink()}({visibilityHelpText()})
                            </span>
                            {renderToggleButtonGroup()}
                          </div>
                        )}
                      </div>
                      <div style={{ marginBottom: 10 }}>
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
            <Row>{renderCancelButton(filterList)}</Row>
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
          </Container>
        </>
      ) : null}
    </>
  );
};

export default FilterPage;

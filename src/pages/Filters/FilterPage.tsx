import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faEdit,
  faExternalLinkAlt,
  faFolderPlus,
  faPlusCircle,
  faQuestionCircle,
  faShare,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  FilterList,
  mapVisibilityString,
  ViewTypes,
  Visibility,
  VisibilityString,
} from "./Interfaces";
import MoveCIDModal from "./MoveCIDModal";
import { isOrphan } from "./utils";

const FilterPage = (props): JSX.Element => {
  const [cids, setCids] = useState<CidItem[]>([]);
  const [checkedCids, setCheckedCids] = useState<CidItem[]>([]);
  const [isBulkActionAllowed, setIsBulkActionAllowed] = useState(false);
  const [isCidBulkEdit, setIsCidBulkEdit] = useState(false);
  const [filterList, setFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );
  const [filterEnabled, setFilterEnabled] = useState(filterList.enabled);
  const [filterOverride, setFilterOverride] = useState(filterList.override);
  const [isOwner, setIsOwner] = useState(false);
  const [filterNotes, setFilterNotes] = useState<string | undefined>(undefined);
  const [initialFilterNotes, setInitialFilterNotes] = useState<
    string | undefined
  >(undefined);

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
  const initFilter = (id: number): void => {
    if (id) {
      setIsEdit(true);
      ApiService.getFilter(id).then((filterList: FilterList) => {
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
    void initFilter(props.match.params.id as number);

    return () => {
      mountedRef.current = false;
    };
  }, [props.match.params.id]);

  useEffect(() => {
    setFilterListChanged(!_.isEqual(filterList, initialFilterList));
  }, [filterList, initialFilterList]);

  const saveFilter = (fl?: FilterList) => {
    if (!fl) {
      fl = filterList;
    }

    setFilterList(fl);
  };

  const [deleteCidItems, setDeleteCidItems] = useState<CidItem[]>([]);

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

  const cancel = (): void => {
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
    const data = await ApiService.getFilters({
      isPaged: false,
    });
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

  const toggleFilterEnabled = () => {
    saveFilter({ ...filterList, enabled: !filterList.enabled });
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

  const renderTitle = (): JSX.Element => {
    if (isImported) {
      return (
        <h2>
          View Filter List &nbsp;<Badge variant="dark">Imported</Badge>
        </h2>
      );
    }

    if (isEdit) {
      return <h2>Edit filter list</h2>;
    }

    return <h2>New filter list</h2>;
  };

  const renderOrigin = (): JSX.Element => {
    if (isOwner || !isImported) {
      return <></>;
    }

    return (
      <Form.Row>
        <Col>
          <h4>Origin</h4>
          <a
            href={`${serverUri()}/filter/${
              filterList.id
            }?providerId=${AuthService.getProviderId()}`}
            className="origin-link"
            target="_blank"
          >
            {serverUri()}/filter/share/{filterList.shareId}
            <FontAwesomeIcon
              icon={faExternalLinkAlt as IconProp}
              className="space-left"
            />
          </a>
        </Col>
      </Form.Row>
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
      <Col>
        <Button
          variant="warning"
          onClick={() => {
            confirmDelete();
          }}
          style={{ float: "right", marginRight: -30 }}
        >
          {isImported ? "Discard" : "Delete"}
        </Button>
      </Col>
    );
  };

  const renderSaveAndCancelButtons = (props: FilterList): JSX.Element => {
    return (
      <Col>
        <Button
          variant="primary"
          style={{ marginBottom: 5 }}
          disabled={!filterListChanged}
          onClick={save}
        >
          Save
        </Button>
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
            <Row style={{ width: "100%" }}>
              <Col>{renderTitle()}</Col>
              {renderDeleteButton(filterList)}
            </Row>
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
                  </Form.Row>
                  <Form.Row>
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
                        placeholder="List Description"
                        value={filterList.description}
                        disabled={isImported}
                      />
                    </Col>
                  </Form.Row>
                  <Form.Row>
                    {(isOwner || !isImported) && (
                      <Col xs={"auto"}>
                        <Form.Group controlId="visibility">
                          <Form.Control
                            as="select"
                            disabled={filterOverride}
                            onChange={changeVisibility}
                            value={VisibilityString[filterList.visibility]}
                          >
                            <option>Public</option>
                            <option>Private</option>
                          </Form.Control>
                        </Form.Group>
                      </Col>
                    )}
                    {(isOwner || !isImported) &&
                      checkViewType() === ViewTypes.Edit && (
                        <Col>
                          <Button
                            variant="primary"
                            onClick={() => {
                              clipboardCopy(filterList.shareId);
                            }}
                          >
                            Direct share
                          </Button>
                        </Col>
                      )}
                  </Form.Row>
                  <Form.Row
                    style={{
                      marginLeft: 2,
                      marginTop: -20,
                      marginBottom: 20,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "center",
                      }}
                      onClick={() =>
                        !isOrphan(filterList) && toggleFilterEnabled()
                      }
                    >
                      <FormCheck
                        readOnly
                        type="switch"
                        disabled={isOrphan(filterList)}
                        checked={filterEnabled}
                      />
                      <Form.Label
                        style={{
                          marginRight: 10,
                          marginTop: 2,
                        }}
                        className={"text-dim"}
                      >
                        Enabled?
                      </Form.Label>
                    </div>
                  </Form.Row>
                  {(isOwner || !isImported) && (
                    <Form.Row
                      style={{
                        marginLeft: 2,
                        marginTop: -35,
                        marginBottom: 20,
                        width: "auto",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "center",
                        }}
                        onClick={() => toggleFilterOverride()}
                      >
                        <FormCheck
                          readOnly
                          type="switch"
                          checked={filterOverride}
                        />
                        <Form.Label
                          style={{
                            marginRight: 10,
                            marginTop: 2,
                          }}
                          className={"text-dim"}
                        >
                          Override?
                        </Form.Label>
                        <OverlayTrigger
                          placement="right"
                          // show={filterList.override ? true : undefined}
                          delay={{ show: 150, hide: 300 }}
                          overlay={
                            <Tooltip id="button-tooltip">
                              Override lists prevent CIDs on imported lists from
                              being filtered
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
                      </div>
                    </Form.Row>
                  )}
                  {filterList.override && (
                    <Form.Row style={{ marginTop: -40, marginLeft: -2 }}>
                      <Col>
                        <Form.Label className={"text-dim"}>
                          Override lists cannot be shared
                        </Form.Label>
                      </Col>
                    </Form.Row>
                  )}
                  <Form.Row style={{ marginTop: -10, marginLeft: -2 }}>
                    <Col>
                      <Form.Label className={"text-dim"}>
                        Shared lists will be accessible to other nodes if they
                        have imported the shareable URL.
                      </Form.Label>
                    </Col>
                  </Form.Row>
                  {renderOrigin()}
                  {renderNotes()}
                  {checkViewType() !== ViewTypes.Imported && (
                    <Form.Row>
                      <Col style={{ display: "flex", flexDirection: "column" }}>
                        <Row>
                          <Col
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              justifyContent: "flex-start",
                              paddingBottom: "1rem",
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
                                  variant="primary"
                                  style={{ width: "100%" }}
                                  onClick={handleBulkEditCids}
                                  disabled={!isBulkActionAllowed}
                                >
                                  <FontAwesomeIcon icon={faEdit as IconProp} />
                                  &nbsp;Edit
                                </Button>
                              </Dropdown.Item>
                              {checkViewType() === ViewTypes.Edit && (
                                <Dropdown.Item>
                                  <Button
                                    variant="warning"
                                    style={{ width: "100%" }}
                                    onClick={handleBulkMoveCids}
                                    disabled={!isBulkActionAllowed}
                                  >
                                    <FontAwesomeIcon
                                      icon={faShare as IconProp}
                                    />
                                    &nbsp;Move
                                  </Button>
                                </Dropdown.Item>
                              )}
                              <Dropdown.Item>
                                <Button
                                  variant="danger"
                                  style={{ width: "100%" }}
                                  onClick={() => {
                                    const items = cids.filter(
                                      (item: CidItem) => item.isChecked
                                    );
                                    prepareCidDeleteModal(items);
                                  }}
                                  disabled={!isBulkActionAllowed}
                                >
                                  <FontAwesomeIcon icon={faTrash as IconProp} />
                                  &nbsp;Delete
                                </Button>
                              </Dropdown.Item>
                            </DropdownButton>
                          </Col>
                        </Row>

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
                      </Col>
                    </Form.Row>
                  )}
                </div>
              </Col>
            </Row>
            <Row>{renderSaveAndCancelButtons(filterList)}</Row>
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
          </Container>
        </>
      ) : null}
    </>
  );
};

export default FilterPage;

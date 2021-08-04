import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faExternalLinkAlt,
  faQuestionCircle,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import _ from "lodash";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  FormCheck,
  ListGroup,
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
import FilterService from "../../services/FilterService";
import AddCidBatchModal from "./AddCidBatchModal";
import CidItemRenderer from "./CidItemRenderer";
import "./Filters.css";
import {
  CidItem,
  FilterList,
  mapVisibilityString,
  Visibility,
  VisibilityString,
  ViewTypes,
} from "./Interfaces";
import MoveCIDModal from "./MoveCIDModal";

const FilterPage = (props): JSX.Element => {
  const [cids, setCids] = useState<CidItem[]>([]);
  const [checkedCids, setCheckedCids] = useState<CidItem[]>([]);
  const [isCidBulkEdit, setIsCidBulkEdit] = useState(false);
  const [filterList, setFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );
  const [filterEnabled, setFilterEnabled] = useState(filterList.enabled);
  const [filterOverride, setFilterOverride] = useState(filterList.override);

  useEffect(() => {
    setCids(
      filterList && filterList.cids && filterList.cids.length
        ? filterList.cids
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

  const [loaded, setLoaded] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isImported, setIsimported] = useState<boolean>(false);
  const [addCidBatchModal, setAddCidBatchModal] = useState<boolean>(false);

  const [invalidFilterId, setInvalidFilterId] = useState<boolean>(false);

  const [moveToFilterList, setMoveToFilterList] =
    useState<FilterList | undefined>(undefined);
  const [initialFilterList, setInitialFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );
  const [filterListChanged, setFilterListChanged] = useState<boolean>(false);
  const history = useHistory();

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
      ApiService.getFilters({ filterId: id }).then(
        (filterLists: FilterList[]) => {
          if (!mountedRef.current) return;
          if (filterLists.length === 0) {
            setInvalidFilterId(true);
            return;
          }

          const cidItems = filterLists[0].cids
            ? filterLists[0].cids.map((cid: CidItem) => {
                return { ...cid, tableKey: generateUniqueKey() };
              })
            : [];
          const fl = {
            ...filterLists[0],
            cids: cidItems,
          };

          if (fl.originId) {
            setIsimported(true);
          }
          setFilterList(fl);
          setInitialFilterList({ ...fl });
          setLoaded(true);
          setFilterEnabled(fl.enabled);
          setFilterOverride(fl.override);
        }
      );
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
    if (isEdit) {
      setLoaded(true);
      const filtersToUpdate = [filterList];
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
      ApiService.addFilter(filterList)
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
    const cids = [
      ...filterList.cids,
      {
        tableKey: generateUniqueKey(),
        cid: "",
        edit: true,
        isChecked: false,
        isSaved: false,
      },
    ];
    setFilterList({ ...filterList, cids });
  };

  const updateCidItem = (cidItem: CidItem, idx: number) => {
    const items = filterList.cids.map((item: CidItem, _idx: number) => {
      return idx === _idx ? cidItem : item;
    });
    const fl = {
      ...filterList,
      cids: items,
    };
    saveFilter(fl);
  };

  const saveItem = (editItem: CidItem, idx: number) => {
    const items = filterList.cids.map((item: CidItem, _idx: number) => {
      return idx === _idx ? { ...editItem, edit: false, isSaved: true } : item;
    });
    const fl = {
      ...filterList,
      cids: items,
    };
    saveFilter(fl);
  };

  const cancelEdit = (editItem: CidItem, index: number) => {
    const cids = [...filterList.cids];

    if (typeof editItem.id === "undefined" && !editItem.isSaved) {
      // Enter here when CID is not persisted to the database and never got saved locally
      // Effect: CID will get deleted from the table
      cids.splice(index, 1);
      saveFilter({
        ...filterList,
        cids,
      });
    } else if (!editItem.cid && !editItem.refUrl) {
      // Enter here when CID has empty cid and empty refUrl
      // Effect: CID will get deleted from the table
      cids.splice(index, 1);
      saveFilter({
        ...filterList,
        cids,
      });
    } else {
      // Enter here under normal conditions
      // Effect: CID will stay in the table
      cids[index] = {
        ...editItem,
        edit: false,
      };
      saveFilter({
        ...filterList,
        cids,
      });
    }
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

  const prepareModalForDeleteItems = (itemsToDelete: CidItem[]) => {
    setDeleteCidItems(itemsToDelete);
    setShowDeleteItemsModal(true);
  };

  const [showMoveModal, setShowMoveModal] = useState<boolean>(false);
  const [moveCidItems, setMoveCidItems] = useState<CidItem[]>([]);
  const [moveOptionFilters, setMoveOptionFilters] = useState<FilterList[]>([]);

  const beginMoveToDifferentFilter = async (
    moveItems: CidItem[]
  ): Promise<void> => {
    const filterLists: FilterList[] = await ApiService.getFilters();

    setMoveCidItems(moveItems);
    setMoveOptionFilters(
      filterLists.filter((x) => x.id !== filterList.id && !x.originId)
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
    beginMoveToDifferentFilter(checkedCids);
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
      toast.success("Filter list deleted successfully");
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
    toast.info("Don't forget to press Save to save the changes.");
  };

  const checkViewType = (): ViewTypes => {
    if (isEdit && filterList.originId) {
      return ViewTypes.Imported;
    }

    if (isEdit && !filterList.originId) {
      return ViewTypes.Edit;
    }

    return ViewTypes.New;
  };

  const renderTitle = (): JSX.Element => {
    if (filterList.originId) {
      return <h2>View filter list</h2>;
    }

    if (isEdit) {
      return <h2>Edit filter list</h2>;
    }

    return <h2>New filter list</h2>;
  };

  const renderOrigin = (): JSX.Element => {
    if (!filterList.originId) {
      return <></>;
    }

    return (
      <Form.Row>
        <Col>
          <h4>Origin</h4>
          <a href={filterList.originId} className="origin-link" target="_blank">
            {filterList.originId}
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
    if (!filterList.originId) {
      return <></>;
    }

    return (
      <Form.Row>
        <Col>
          <h4>Notes</h4>
          <Form.Control
            role="notes"
            onChange={(ev: ChangeEvent<HTMLInputElement>) => {
              saveFilter({
                ...filterList,
                notes: ev.target.value,
              });
            }}
            as="textarea"
            placeholder="Notes"
            value={filterList.notes || ""}
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
          disabled={
            checkViewType() === ViewTypes.Imported && !filterListChanged
          }
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
                        disabled={!!filterList.originId}
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
                        disabled={!!filterList.originId}
                      />
                    </Col>
                  </Form.Row>

                  <Form.Row>
                    <Col xs={"auto"}>
                      <Form.Group controlId="visibility">
                        <Form.Control
                          as="select"
                          disabled={
                            !!filterList.originId || filterList.override
                          }
                          onChange={changeVisibility}
                          value={VisibilityString[filterList.visibility]}
                        >
                          <option>Public</option>
                          <option>Private</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col>
                      {checkViewType() === ViewTypes.Edit && (
                        <Button
                          variant="primary"
                          onClick={() => {
                            clipboardCopy(filterList.shareId);
                          }}
                        >
                          Direct share
                        </Button>
                      )}
                    </Col>
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
                      onClick={() => toggleFilterEnabled()}
                    >
                      <FormCheck
                        readOnly
                        type="switch"
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
                  {!filterList.originId && (
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
                              {filterList.override
                                ? "Override lists cannot be shared"
                                : "Override lists prevent CIDs on imported lists from being filtered"}
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
                  <Form.Row style={{ marginTop: -20 }}>
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
                      <Col>
                        <Button
                          variant="primary"
                          style={{ marginBottom: 5 }}
                          onClick={onNewCid}
                          disabled={!!filterList.originId}
                        >
                          + new CID
                        </Button>
                        <Button
                          variant="primary"
                          style={{ marginBottom: 5, marginLeft: 5 }}
                          onClick={() => {
                            setAddCidBatchModal(true);
                          }}
                          disabled={!!filterList.originId}
                        >
                          + Add CIDs batch
                        </Button>
                        <Button
                          variant="primary"
                          style={{ marginBottom: 5, marginLeft: 5 }}
                          onClick={handleBulkEditCids}
                          disabled={
                            !checkedCids || !checkedCids.length || isCidBulkEdit
                          }
                        >
                          Edit selected CIDs
                        </Button>
                        <Button
                          variant="secondary"
                          style={{ marginBottom: 5, marginLeft: 5 }}
                          onClick={() => {
                            const items = cids.filter(
                              (item: CidItem) => item.isChecked
                            );
                            prepareModalForDeleteItems(items);
                          }}
                          disabled={!checkedCids || !checkedCids.length}
                        >
                          Delete selected CIDs
                        </Button>
                        {checkViewType() === ViewTypes.Edit && (
                          <Button
                            variant="warning"
                            style={{ marginBottom: 5, marginLeft: 5 }}
                            onClick={handleBulkMoveCids}
                            disabled={!checkedCids || !checkedCids.length}
                          >
                            Move selected CIDs
                          </Button>
                        )}
                        <ListGroup style={{ width: "100%" }}>
                          {cids.map((item: CidItem, index: number) => (
                            <CidItemRenderer
                              // Each child in a list should have a unique "key" prop
                              key={item.tableKey}
                              index={index}
                              cidItem={item}
                              filterList={filterList}
                              isEdit={isEdit && !isCidBulkEdit}
                              isOverrideFilter={filterList.override}
                              isHashedCid={!!filterList.originId}
                              saveItem={saveItem}
                              updateCidItem={updateCidItem}
                              cancelEdit={cancelEdit}
                              beginMoveToDifferentFilter={
                                beginMoveToDifferentFilter
                              }
                              prepareModalForDeleteItems={
                                prepareModalForDeleteItems
                              }
                            />
                          ))}
                        </ListGroup>
                      </Col>
                    </Form.Row>
                  )}
                </div>
              </Col>
            </Row>
            <Row>{renderSaveAndCancelButtons(filterList)}</Row>
            <MoveCIDModal
              cidItems={moveCidItems}
              optionFilters={moveOptionFilters}
              move={move}
              closeCallback={closeModalCallback}
              show={showMoveModal}
            />
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

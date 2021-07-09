import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  ListGroup,
  Row,
  FormCheck,
} from "react-bootstrap";
import { Prompt } from "react-router";

import {
  CidItem,
  FilterList,
  mapVisibilityString,
  Visibility,
  VisibilityString,
  ViewTypes,
} from "./Interfaces";
import "./Filters.css";
import CidItemRender from "./CidItemRenderer";
import MoveCIDModal from "./MoveCIDModal";
import ApiService from "../../services/ApiService";
import FilterService from "../../services/FilterService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import AddCidBatchModal from "./AddCidBatchModal";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { useHistory, useLocation } from "react-router-dom";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import { toast } from "react-toastify";
import { serverUri } from "../../config";
import { filter } from "lodash";

function FilterPage(props) {
  const [cidItems, setCidItems] = useState<CidItem[]>([]);
  const [isAnyCidSelected, setIsAnyCidSelected] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>("");

  const [loaded, setLoaded] = useState<boolean>(false);
  const [alertUnsaved, setAlertUnsaved] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [addCidBatchModal, setAddCidBatchModal] = useState<boolean>(false);

  const [invalidFilterId, setInvalidFilterId] = useState<boolean>(false);
  const [filterList, setFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );
  const [initialFilterList, setInitialFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );
  const [notesChanged, setNotesChanged] = useState<boolean>(false);

  const [filterEnabled, setFilterEnabled] = useState(filterList.enabled);
  const [filterOverride, setFilterOverride] = useState(filterList.override);
  const history = useHistory();

  const mountedRef = useRef(true);
  const initFilter = (id: number): void => {
    if (id) {
      setIsEdit(true);
      ApiService.getFilters().then((filterLists: FilterList[]) => {
        if (!mountedRef.current) return;
        filterLists = filterLists.filter((fl: FilterList) => fl._id == id);
        if (filterLists.length === 0) {
          setInvalidFilterId(true);
          return;
        }

        setFilterList(filterLists[0]);
        setInitialFilterList({ ...filterLists[0] });
        setCidItems(
          filterLists[0].cids
            ? filterLists[0].cids.map((cid: string, index: number) => {
                return {
                  cid,
                  id: index,
                  edit: false,
                  rerender: true,
                  isChecked: false,
                };
              })
            : []
        );
        setLoaded(true);
        setFilterEnabled(filterLists[0].enabled);
        setFilterOverride(filterLists[0].override);
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
  }, []);

  useEffect(() => {
    if (
      filterList.notes === initialFilterList.notes ||
      (filterList.notes === "" && !initialFilterList.notes)
    ) {
      setNotesChanged(false);
    }
  }, [filterList]);

  const saveFilter = (fl?: FilterList) => {
    if (!fl) {
      fl = filterList;
    }

    setFilterList(fl);
    setAlertUnsaved(true);
  };

  const save = (): void => {
    if (isEdit) {
      setLoaded(true);
      ApiService.updateFilter(filterList)
        .then((res) => {
          history.push(`/filters`);
          toast.success("Filter list updated successfully");
          setLoaded(false);
        })
        .catch((err) => {
          toast.error("Error: " + err.message);
          setLoaded(false);
        });
    } else {
      ApiService.addFilter(filterList)
        .then((res) => {
          history.push(`/filters`);
          toast.success("Filter list created successfully");
          setLoaded(false);
        })
        .catch((err) => {
          toast.error("Error: " + err.message);
          setLoaded(false);
        });
    }
    setAlertUnsaved(false);
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
    setNotice("Name successfully saved.");
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
    setNotice("Visibility successfully saved.");
  };

  const onNewCid = (): void => {
    setNotice("");
    const items = cidItems;
    items.push({
      cid: "",
      edit: true,
      id: items.length,
      rerender: true,
      isChecked: false,
    });
    const cids = filterList.cids;
    cids.push("");
    setFilterList({ ...filterList, cids });
  };

  const getSelectedCidItems = (items: CidItem[]): CidItem[] => {
    return items.filter((item: CidItem) => item.isChecked);
  };

  const updateIsAnyCidSelected = (items: CidItem[]) => {
    const selectedCidItems = getSelectedCidItems(items);
    const count = selectedCidItems.length;

    if (count > 0) {
      setIsAnyCidSelected(true);
    } else {
      setIsAnyCidSelected(false);
    }
  };

  const updateCidItem = (cidItem: CidItem) => {
    const items = cidItems.map((item: CidItem) => {
      return item.id === cidItem.id ? cidItem : item;
    });
    setCidItems(items);
    updateIsAnyCidSelected(items);
  };

  const saveItem = (editItem: CidItem) => {
    const items = cidItems.map((item: CidItem) => {
      return item.id === editItem.id ? { ...editItem, edit: false } : item;
    });
    const fl = {
      ...filterList,
      cids: items.map((i: CidItem) => i.cid),
    };
    saveFilter(fl);
    setCidItems(items);
    updateIsAnyCidSelected(items);
    setNotice("CIDs successfully saved.");
  };

  const changeCidValue = (editItem: CidItem) => {
    const items = cidItems.map((item: CidItem) => {
      return item.id === editItem.id ? editItem : item;
    });
    const fl = {
      ...filterList,
      cids: items.map((i: CidItem) => i.cid),
    };
    saveFilter(fl);
    setCidItems(items);
    updateIsAnyCidSelected(items);
  };

  const cancelEdit = (editItem: CidItem, index: number) => {
    if (editItem.cid) {
      editItem.edit = false;
      cidItems[index] = editItem;
      updateIsAnyCidSelected(cidItems);

      const fl = {
        ...filterList,
        cids: cidItems.map((i: CidItem) => i.cid),
      };
      saveFilter(fl);
    } else {
      cidItems.splice(index, 1);
      updateIsAnyCidSelected(cidItems);

      const fl = {
        ...filterList,
        cids: cidItems.map((i: CidItem) => i.cid),
      };
      saveFilter(fl);
    }
  };

  useEffect(() => {
    let ok = false;
    for (let i = 0; i < cidItems.length; i++) {
      if (!cidItems[i].rerender) {
        cidItems[i].rerender = true;
        ok = true;
      }
    }

    if (ok) {
      setCidItems([...cidItems.map((x) => ({ ...x }))]);
    }
  }, [cidItems]);

  const saveBatchItemCids = () => {
    const itemsId: string[] = [];
    cidItems.forEach((item: CidItem) => {
      if (false == item.edit) {
        itemsId.push(item.cid);
      }
    });

    const fl = {
      ...filterList,
      cids: itemsId ? itemsId : [],
    };
    saveFilter(fl);
    setNotice("CIDs successfully saved.");
  };

  const onNewCidsBatch = (cidsBatch): void => {
    setNotice("");
    const newCids: Array<CidItem> = [];
    cidsBatch.forEach((element: string, index: number) => {
      const item = {
        cid: element,
        edit: true,
        id: index,
        rerender: true,
        isChecked: false,
      };
      newCids.push(item);
    });
    setCidItems([...cidItems, ...newCids]);
    saveBatchItemCids();
    const cids = filterList.cids.concat(cidsBatch);
    setFilterList({ ...filterList, cids });
  };

  const [showDeleteItemsModal, setShowDeleteItemsModal] =
    useState<boolean>(false);
  const [deleteCidItems, setDeleteCidItems] = useState<CidItem[]>([]);

  const deleteItems = () => {
    const idsToDelete = deleteCidItems.map((i: CidItem) => i.id);
    const items = cidItems.filter(
      (item: CidItem) => !idsToDelete.includes(item.id)
    );
    const fl = {
      ...filterList,
      cids: items.map((i: CidItem) => i.cid),
    };
    saveFilter(fl);
    setCidItems(items);
    updateIsAnyCidSelected(items);
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
      filterLists.filter((x) => x._id !== filterList._id && !x.origin)
    );
    setShowMoveModal(true);
  };

  const handleBulkEditCids = (): void => {
    const items = cidItems.map((item: CidItem) => {
      return item.isChecked
        ? { ...item, edit: true, rerender: false, isChecked: false }
        : item;
    });
    setCidItems(items);
    updateIsAnyCidSelected(items);
  };

  const handleBulkMoveCids = (): void => {
    const selectedCidItems = getSelectedCidItems(cidItems);
    beginMoveToDifferentFilter(selectedCidItems);
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
    setTitle(`Delete filter ${filterList._id}`);
    setMessage(`Are you sure you want to delete filter "${filterList.name}?"`);
  }, [showConfirmDelete, deletedFilterList]);

  const deleteCurrentFilter = async (): Promise<void> => {
    ApiService.deleteFilter(filterList._id as number).then(() => {
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
    selBox.value = serverUri() + "/filters/shared/" + cryptId;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand("copy");
    document.body.removeChild(selBox);
    toast.success("Shared link was copied succesfully");
  };

  const toggleFilterEnabled = () => {
    filterList.enabled = !filterList.enabled;
    setFilterEnabled(filterList.enabled);
  };

  const toggleFilterOverride = () => {
    filterList.override = !filterList.override;
    setFilterOverride(filterList.override);
  };

  const closeModalCallback = () => {
    setShowMoveModal(false);
  };

  const move = async (
    items: CidItem[],
    selectedFilter: FilterList
  ): Promise<void> => {
    const cids = items.map((item: CidItem) => {
      return item.cid;
    });

    selectedFilter.cids.push(...cids);
    filterList.cids = filterList.cids.filter((x) => !cids.includes(x));

    await ApiService.updateFilter([selectedFilter, filterList]);

    const ids = items.map((item: CidItem) => {
      return item.id;
    });
    const newCidItems = cidItems.filter(
      (item: CidItem) => !ids.includes(item.id)
    );
    setCidItems(newCidItems);
    updateIsAnyCidSelected(newCidItems);
  };

  const checkViewType = (): ViewTypes => {
    if (isEdit && filterList.origin) {
      return ViewTypes.Imported;
    }

    if (isEdit && !filterList.origin) {
      return ViewTypes.Edit;
    }

    return ViewTypes.View;
  };

  const renderTitle = (): JSX.Element => {
    if (filterList.origin) {
      return <h2>View filter list</h2>;
    }
    if (isEdit) {
      return <h2>Edit filter list</h2>;
    }

    return <h2>New filter list</h2>;
  };

  const renderOrigin = (): JSX.Element => {
    if (!filterList.origin) {
      return <></>;
    }

    return (
      <Form.Row>
        <Col>
          <h4>Origin</h4>
          <a href={filterList.origin} className="origin-link" target="_blank">
            {filterList.origin}
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
    if (!filterList.origin) {
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

              setNotesChanged(true);
            }}
            as="textarea"
            placeholder="Notes"
            value={filterList.notes}
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
          Delete
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
          disabled={checkViewType() === ViewTypes.Imported && !notesChanged}
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
                        disabled={!!filterList.origin}
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

                          setNotice("Description successfully saved");
                        }}
                        as="textarea"
                        placeholder="List Description"
                        value={filterList.description}
                        disabled={!!filterList.origin}
                      />
                    </Col>
                  </Form.Row>

                  <Form.Row>
                    <Col xs={"auto"}>
                      <Form.Group controlId="visibility">
                        <Form.Control
                          as="select"
                          disabled={!!filterList.origin}
                          onChange={changeVisibility}
                          value={VisibilityString[filterList.visibility]}
                        >
                          <option>Public</option>
                          <option>Private</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col>
                      {checkViewType() !== ViewTypes.Imported && (
                        <Button
                          variant="primary"
                          onClick={() => {
                            clipboardCopy(filterList["_cryptId"]);
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
                    onClick={() => toggleFilterEnabled()}
                  >
                    <FormCheck readOnly type="switch" checked={filterEnabled} />
                    <Form.Label
                      style={{
                        marginRight: 10,
                        marginTop: 2,
                      }}
                      className={"text-dim"}
                    >
                      Enabled?
                    </Form.Label>
                  </Form.Row>
                  <Form.Row
                    style={{
                      marginLeft: 2,
                      marginTop: -35,
                      marginBottom: 20,
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
                  </Form.Row>
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
                          disabled={!!filterList.origin}
                        >
                          + new CID
                        </Button>
                        <Button
                          variant="primary"
                          style={{ marginBottom: 5, marginLeft: 5 }}
                          onClick={() => {
                            setAddCidBatchModal(true);
                          }}
                          disabled={!!filterList.origin}
                        >
                          + Add CIDs batch
                        </Button>
                        <Button
                          variant="primary"
                          style={{ marginBottom: 5, marginLeft: 5 }}
                          onClick={handleBulkEditCids}
                          disabled={!isAnyCidSelected}
                        >
                          Edit selected CIDs
                        </Button>
                        <Button
                          variant="secondary"
                          style={{ marginBottom: 5, marginLeft: 5 }}
                          onClick={() => {
                            const items = cidItems.filter(
                              (item: CidItem) => item.isChecked
                            );
                            prepareModalForDeleteItems(items);
                          }}
                          disabled={!isAnyCidSelected}
                        >
                          Delete selected CIDs
                        </Button>
                        {checkViewType() === ViewTypes.Edit && (
                          <Button
                            variant="warning"
                            style={{ marginBottom: 5, marginLeft: 5 }}
                            onClick={handleBulkMoveCids}
                            disabled={!isAnyCidSelected}
                          >
                            Move selected CIDs
                          </Button>
                        )}
                        <ListGroup style={{ width: "100%" }}>
                          {cidItems
                            .filter((item: CidItem) => item.rerender)
                            .map((item: CidItem, index: number) => {
                              return (
                                <CidItemRender
                                  // Each child in a list should have a unique "key" prop
                                  key={item.id.toString()}
                                  cidItem={item}
                                  isEdit={isEdit}
                                  saveItem={saveItem}
                                  prepareModalForDeleteItems={
                                    prepareModalForDeleteItems
                                  }
                                  changeCidValue={changeCidValue}
                                  cancelEdit={cancelEdit}
                                  updateCidItem={updateCidItem}
                                  beginMoveToDifferentFilter={
                                    beginMoveToDifferentFilter
                                  }
                                  filterList={filterList}
                                  index={index}
                                  isOverrideFilter={filterList.override}
                                  isHashedCid={!!filterList.origin}
                                />
                              );
                            })}
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
              closeCallback={async (cidsBatch = []): Promise<void> => {
                if (0 != cidsBatch.length) {
                  onNewCidsBatch(cidsBatch);
                }
                setAddCidBatchModal(false);
              }}
              show={addCidBatchModal}
            />
            <Prompt
              when={alertUnsaved}
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
}
export default FilterPage;

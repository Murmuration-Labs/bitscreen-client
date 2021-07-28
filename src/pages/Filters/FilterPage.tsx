import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  Button,
  Col,
  Container,
  Form,
  FormCheck,
  ListGroup,
  Row,
} from "react-bootstrap";
import { Prompt } from "react-router";
import { useHistory, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/Modal/ConfirmModal";
import { serverUri } from "../../config";
import _ from "lodash";
import ApiService from "../../services/ApiService";
import FilterService from "../../services/FilterService";
import AddCidBatchModal from "./AddCidBatchModal";
import CidItemRender from "./CidItemRenderer";
import "./Filters.css";
import {
  CidItem,
  FilterList,
  mapVisibilityString,
  VisibilityString,
  ViewTypes,
} from "./Interfaces";
import MoveCIDModal from "./MoveCIDModal";

const FilterPage = (props) => {
  const [isAnyCidSelected, setIsAnyCidSelected] = useState<boolean>(false);
  const [_notice, setNotice] = useState<string>("");

  const [loaded, setLoaded] = useState<boolean>(false);
  const [alertUnsaved, setAlertUnsaved] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isImported, setIsimported] = useState<boolean>(false);
  const [addCidBatchModal, setAddCidBatchModal] = useState<boolean>(false);

  const [invalidFilterId, setInvalidFilterId] = useState<boolean>(false);
  const [filterList, setFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );
  const [moveToFilterList, setMoveToFilterList] =
    useState<FilterList | undefined>(undefined);
  const [initialFilterList, setInitialFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );
  const [filterListChanged, setFilterListChanged] = useState<boolean>(false);

  const [filterEnabled, setFilterEnabled] = useState(filterList.enabled);
  const [filterOverride, setFilterOverride] = useState(filterList.override);
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
      ApiService.getFilters().then((filterLists: FilterList[]) => {
        if (!mountedRef.current) return;
        filterLists = filterLists.filter((fl: FilterList) => fl.id == id);
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
    if (
      _.isEqual(filterList, initialFilterList) &&
      initialFilterList.enabled === filterEnabled &&
      initialFilterList.override === filterOverride
    ) {
      setFilterListChanged(false);
    } else {
      setFilterListChanged(true);
    }
  }, [filterList, filterEnabled, filterOverride]);

  const saveFilter = (fl?: FilterList) => {
    if (!fl) {
      fl = filterList;
    }

    setFilterList(fl);
    setAlertUnsaved(true);
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
        .then((res) => {
          history.push(`/filters`);
          toast.success("Filter list updated successfully");
          setLoaded(false);
        })
        .catch((err) => {
          toast.error("Error: " + err.message);
          setLoaded(false);
        });
      ApiService.deleteCid(deleteCidItems);
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
    const cids = [
      ...filterList.cids,
      {
        tableKey: generateUniqueKey(),
        cid: "",
        edit: true,
        rerender: true,
        isChecked: false,
      },
    ];
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

  const updateCidItem = (cidItem: CidItem, idx: number) => {
    const items = filterList.cids.map((item: CidItem, _idx: number) => {
      return idx === _idx ? cidItem : item;
    });
    const fl = {
      ...filterList,
      cids: items,
    };
    saveFilter(fl);
    updateIsAnyCidSelected(items);
  };

  const saveItem = (editItem: CidItem, idx: number) => {
    const items = filterList.cids.map((item: CidItem, _idx: number) => {
      return idx === _idx ? { ...editItem, edit: false } : item;
    });
    const fl = {
      ...filterList,
      cids: items,
    };
    saveFilter(fl);
    updateIsAnyCidSelected(items);
    setNotice("CIDs successfully saved.");
  };

  const changeCidValue = (editItem: CidItem, idx: number) => {
    const items = filterList.cids.map((item: CidItem, _idx) => {
      return _idx === idx ? editItem : item;
    });
    const fl = {
      ...filterList,
      cids: items,
    };
    saveFilter(fl);
    updateIsAnyCidSelected(items);
  };

  const cancelEdit = (editItem: CidItem, index: number) => {
    const cids = [...filterList.cids];

    // Not persisted case
    if (typeof editItem.id === "undefined") {
      // This alters the array
      cids.splice(index, 1);

      return saveFilter({
        ...filterList,
        cids,
      });
    }

    if (editItem.cid) {
      cids[index] = {
        ...editItem,
        edit: false,
      };
      updateIsAnyCidSelected(cids);

      saveFilter({
        ...filterList,
        cids,
      });
    } else {
      saveFilter({
        ...filterList,
        cids: cids.splice(index, 1),
      });
    }
  };

  // useEffect(() => {
  //   let ok = false;
  //   for (let i = 0; i < cidItems.length; i++) {
  //     if (!cidItems[i].rerender) {
  //       cidItems[i].rerender = true;
  //       ok = true;
  //     }
  //   }

  //   if (ok) {
  //     setCidItems([...cidItems.map((x) => ({ ...x }))]);
  //   }
  // }, [cidItems]);

  const saveBatchItemCids = () => {
    saveFilter(filterList);
    setNotice("CIDs successfully saved.");
  };

  const onNewCidsBatch = (cidsBatch): void => {
    setNotice("");
    const cids = cidsBatch.map((element: string) => ({
      tableKey: generateUniqueKey(),
      cid: element,
      edit: true,
      rerender: true,
    }));

    saveFilter({ ...filterList, cids: [...filterList.cids, ...cids] });
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
    updateIsAnyCidSelected(items);
    toast.info("Don't forget to press Save to save the changes.");
    setNotice("CIDs successfully saved.");
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
      return item.isChecked
        ? { ...item, edit: true, rerender: false, isChecked: false }
        : item;
    });
    const fl = {
      ...filterList,
      cids: items,
    };
    saveFilter(fl);
    updateIsAnyCidSelected(items);
  };

  const handleBulkMoveCids = (): void => {
    const selectedCidItems = getSelectedCidItems(filterList.cids);
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
    selectedFilter.cids = [...selectedFilter.cids, ...items];
    setMoveToFilterList(selectedFilter);

    filterList.cids = filterList.cids.filter((x) => !items.includes(x));
    updateIsAnyCidSelected(filterList.cids);
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

                          setNotice("Description successfully saved");
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
                          disabled={!!filterList.originId}
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
                  {!filterList.originId && (
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
                          disabled={!isAnyCidSelected}
                        >
                          Edit selected CIDs
                        </Button>
                        <Button
                          variant="secondary"
                          style={{ marginBottom: 5, marginLeft: 5 }}
                          onClick={() => {
                            const items = filterList.cids.filter(
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
                          {filterList.cids.map(
                            (item: CidItem, index: number) => (
                              <CidItemRender
                                // Each child in a list should have a unique "key" prop
                                key={item.tableKey}
                                index={index}
                                cidItem={item}
                                filterList={filterList}
                                isEdit={isEdit}
                                isOverrideFilter={filterList.override}
                                isHashedCid={!!filterList.originId}
                                saveItem={saveItem}
                                updateCidItem={updateCidItem}
                                changeCidValue={changeCidValue}
                                cancelEdit={cancelEdit}
                                beginMoveToDifferentFilter={
                                  beginMoveToDifferentFilter
                                }
                                prepareModalForDeleteItems={
                                  prepareModalForDeleteItems
                                }
                              />
                            )
                          )}
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
};
export default FilterPage;

import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { ChangeEvent, useEffect, useState } from "react";
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
} from "./Interfaces";
import MoveCIDModal from "./MoveCIDModal";

const FilterPage = (props) => {
  const [_notice, setNotice] = useState<string>("");

  const emptyCidItem: CidItem = {
    id: 0,
    cid: "",
    edit: false,
  };

  const [loaded, setLoaded] = useState<boolean>(false);
  const [alertUnsaved, setAlertUnsaved] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [addCidBatchModal, setAddCidBatchModal] = useState<boolean>(false);

  const [invalidFilterId, setInvalidFilterId] = useState<boolean>(false);
  const [filterList, setFilterList] = useState<FilterList>(
    FilterService.emptyFilterList()
  );
  const [toBeDeletedCids, setToBeDeletedCids] = useState<CidItem[]>([]);

  const [filterOverride, setFilterOverride] = useState(filterList.override);
  const history = useHistory();
  const currentUrl = useLocation().pathname;

  const initFilter = (id: number): void => {
    if (id) {
      setIsEdit(true);
      ApiService.getFilters().then((filterLists: FilterList[]) => {
        filterLists = filterLists.filter((fl: FilterList) => fl.id == id);
        if (filterLists.length === 0) {
          setInvalidFilterId(true);
          return;
        }

        setFilterList(filterLists[0]);
        setLoaded(true);
        setFilterOverride(filterLists[0].override);
      });
    } else {
      setLoaded(true);
    }
  };

  useEffect(() => {
    void initFilter(props.match.params.id as number);
  }, [props.match.params.id]);

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
      ApiService.deleteCid(toBeDeletedCids);
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
    const cids = [...filterList.cids, { cid: "", edit: true, rerender: true }];
    setFilterList({ ...filterList, cids });
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
  };

  const cancelEdit = (editItem: CidItem, index: number) => {
    const cids = [...filterList.cids];

    if (editItem.cid) {
      editItem.edit = false;
      editItem.rerender = false;

      cids[index] = editItem;

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
      cid: element,
      edit: true,
      rerender: true,
    }));

    saveFilter({ ...filterList, cids: [...filterList.cids, ...cids] });
  };

  const deleteItem = async (deleteItem: CidItem, idx: number) => {
    const copy = filterList.cids.slice();
    console.log(idx);
    const toBeDeleted = copy.splice(idx, 1);
    console.log(copy);
    setToBeDeletedCids([...toBeDeletedCids, ...toBeDeleted]);
    saveFilter({
      ...filterList,
      cids: copy,
    });
    setNotice("CIDs successfully saved.");
  };

  const [showMoveModal, setShowMoveModal] = useState<boolean>(false);
  const [moveCidItem, setMoveCidItem] = useState<CidItem>(emptyCidItem);
  const [moveOptionFilters, setMoveOptionFilters] = useState<FilterList[]>([]);

  const beginMoveToDifferentFilter = async (
    moveItem: CidItem,
    idx: number
  ): Promise<void> => {
    const filterLists: FilterList[] = await ApiService.getFilters();

    setMoveCidItem(moveItem);
    setMoveOptionFilters(
      filterLists.filter((x, _idx) => _idx !== idx && !x.origin)
    );
    setShowMoveModal(true);
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
    setTitle(`Delete filter ${filterList.id}`);
    setMessage(`Are you sure you want to delete filter "${filterList.name}?"`);
  }, [showConfirmDelete, deletedFilterList]);

  const deleteCurrentFilter = async (): Promise<void> => {
    ApiService.deleteFilter(filterList.id as number).then(() => {
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

  const toggleFilterOverride = () => {
    filterList.override = !filterList.override;
    setFilterOverride(filterList.override);
  };

  const closeModalCallback = () => {
    setShowMoveModal(false);
  };

  const move = async (
    cidItem: CidItem,
    selectedFilter: FilterList
  ): Promise<void> => {
    await ApiService.updateFilter([
      { ...selectedFilter, cids: [...selectedFilter.cids, cidItem] },
      {
        ...filterList,
        cids: [...filterList.cids.splice(filterList.cids.indexOf(cidItem), 1)],
      },
    ]);
    initFilter(props.match.params.id);
  };

  const renderTitle = (): JSX.Element => {
    if (filterList.origin) {
      return <h2>View filter list</h2>;
    }

    if (currentUrl.includes("edit")) {
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

              setNotice("Notes successfully saved");
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
    if (currentUrl.includes("new") || props.origin) {
      return <></>;
    }

    return (
      <Col>
        <Button
          variant="warning"
          onClick={() => {
            confirmDelete();
          }}
          style={{ float: "right" }}
        >
          Delete
        </Button>
      </Col>
    );
  };

  const renderSaveAndCancelButtons = (props: FilterList): JSX.Element => {
    if (props.origin) {
      return (
        <Col>
          <Button
            variant="primary"
            style={{ marginBottom: 5 }}
            onClick={cancel}
          >
            Go Back
          </Button>
        </Col>
      );
    }

    return (
      <Col>
        <Button variant="primary" style={{ marginBottom: 5 }} onClick={save}>
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
                <Form>
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
                      <Button
                        variant="primary"
                        onClick={() => {
                          clipboardCopy(filterList["_cryptId"]);
                        }}
                      >
                        Direct share
                      </Button>
                    </Col>
                  </Form.Row>
                  <Form.Row
                    style={{
                      marginLeft: 2,
                      marginTop: -20,
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
                      <ListGroup style={{ width: "100%" }}>
                        {filterList.cids.map((item: CidItem, index: number) => (
                          <CidItemRender
                            index={index}
                            key={index}
                            cidItem={item}
                            isOverrideFilter={filterList.override}
                            saveItem={saveItem}
                            deleteItem={deleteItem}
                            changeCidValue={changeCidValue}
                            cancelEdit={cancelEdit}
                            beginMoveToDifferentFilter={
                              beginMoveToDifferentFilter
                            }
                            filterList={filterList}
                            isHashedCid={!!filterList.origin}
                          />
                        ))}
                      </ListGroup>
                    </Col>
                  </Form.Row>
                </Form>
              </Col>
            </Row>
            <Row>{renderSaveAndCancelButtons(filterList)}</Row>
            <MoveCIDModal
              cidItem={moveCidItem}
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

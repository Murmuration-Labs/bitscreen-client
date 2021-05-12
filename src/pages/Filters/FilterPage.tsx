import React, { useEffect, useState } from "react";
import { Button, Col, Container, Form, ListGroup, Row } from "react-bootstrap";
import {
  CidItem,
  FilterList,
  Visibility,
  VisibilityString,
  mapVisibilityString,
} from "./Interfaces";
import "./Filters.css";
import { serverUri } from "../../config";
import CidItemRender from "./CidItemRenderer";

function FilterPage(props) {
  const [cidItems, setCidItems] = useState<CidItem[]>([]);
  const emptyFilterList: FilterList = {
    cids: [],
    _id: 0,
    name: "",
    enabled: true,
    visibility: Visibility.Private,
  };
  const [loaded, setLoaded] = useState<boolean>(false);
  const [filterList, setFilterList] = useState<FilterList>(emptyFilterList);

  const putFilters = async (fl?: FilterList): Promise<FilterList> => {
    if (!fl) {
      fl = filterList;
    }
    if (!fl) return fl;
    console.log("putFilters: " + fl.cids + JSON.stringify(fl));
    await fetch(`${serverUri()}/filters`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fl),
    });
    console.log("filterList updated", JSON.stringify(fl));
    return fl;
  };

  const createNewFilter = async (fl: FilterList) => {
    fetch(`${serverUri()}/filters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fl),
    }).then(() => {
      console.log("new filterList saved: ", JSON.stringify(fl));
    });
  };

  const initFilter = (id: number): void => {
    fetch(`${serverUri()}/filters`)
      .then((filters) => filters.json())
      .then((filterLists: FilterList[]) => {
        console.log("filters loaded ", id, JSON.stringify(filterLists));
        filterLists = filterLists.filter((fl: FilterList) => fl._id == id);
        if (filterLists.length === 0) {
          filterLists.push({
            ...filterList,
            _id: id,
            name: `New filter (${id})`,
          });
          createNewFilter(filterLists[0]);
        }
        console.log("editing filter ", JSON.stringify(filterLists));
        setFilterList(filterLists[0]);
        setCidItems(
          filterLists[0].cids.map((cid: string, index: number) => {
            return { cid, id: index, edit: false };
          })
        );
        setLoaded(true);
      });
  };

  useEffect(() => {
    void initFilter(props.match.params.id);
  }, []);

  const saveFilter = (fl?: FilterList) => {
    if (!fl) {
      fl = filterList;
    }
    putFilters(fl).then(async (_fl: FilterList) => {
      console.log("filter saved " + _fl.name + _fl.cids);
    });
    setFilterList(fl);
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
    const items = cidItems;
    items.push({ cid: "", edit: true, id: items.length });
    const cids = filterList.cids;
    cids.push("");
    setFilterList({ ...filterList, cids });
  };

  const saveItem = (editItem: CidItem) => {
    const items = cidItems.map((item: CidItem) => {
      return item.id === editItem.id ? { ...editItem, edit: false } : item;
    });
    const fl = {
      ...filterList,
      cids: items.map((i: CidItem) => i.cid),
    };
    console.log("saveItem: " + editItem.cid + JSON.stringify(filterList));
    saveFilter(fl);
    setCidItems(items);
  };

  const deleteItem = (deleteItem: CidItem) => {
    const items = cidItems.filter((item: CidItem) => item.id !== deleteItem.id);
    const fl = {
      ...filterList,
      cids: items.map((i: CidItem) => i.cid),
    };
    saveFilter(fl);
    setCidItems(items);
  };

  return (
    <>
      {loaded ? (
        <>
          <Container>
            <h2>{filterList.name ? "Edit filter list" : "New filter list"}</h2>
            <Row>
              <Col>
                <Form>
                  <Form.Row>
                    <Col>
                      <Form.Control
                        onChange={changeName}
                        type="text"
                        placeholder="List Name"
                        value={filterList.name}
                      />
                    </Col>
                  </Form.Row>
                  <Form.Row>
                    <Col xs={"auto"}>
                      <Form.Group controlId="visibility">
                        <Form.Control
                          as="select"
                          onChange={changeVisibility}
                          value={VisibilityString[filterList.visibility]}
                        >
                          <option>Public</option>
                          <option>Private</option>
                        </Form.Control>
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Label className={"text-dim"}>
                        Shared lists will be accessible to other nodes if they
                        have imported the shareable URL.
                      </Form.Label>
                    </Col>
                  </Form.Row>
                  <Form.Row>
                    <Col>
                      <Button className="btn-light" onClick={onNewCid}>
                        + new CID
                      </Button>
                      <ListGroup style={{ width: "100%", height: 500 }}>
                        {cidItems.map((item: CidItem, index: number) => (
                          <CidItemRender
                            index={index}
                            key={item.id.toString()}
                            cidItem={item}
                            saveItem={saveItem}
                            deleteItem={deleteItem}
                          />
                        ))}
                      </ListGroup>
                    </Col>
                  </Form.Row>
                </Form>
              </Col>
            </Row>
          </Container>
        </>
      ) : null}
    </>
  );
}
export default FilterPage;

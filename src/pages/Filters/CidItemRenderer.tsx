import * as React from "react";
// import GridLayout from "react-grid-layout";
import { CidItem, CidItemProps } from "./Interfaces";
import { Button, Card, ListGroup } from "react-bootstrap";
import { ChangeEvent } from "react";

// function validateCid(cid: string): boolean{
//     // :TODO: check length, check allowed characters
//     return true;
// }

export default class CidItemRender extends React.Component<
  CidItemProps,
  { item: CidItem }
> {
  constructor(props: CidItemProps) {
    super(props);
    this.state = { item: this.props.cidItem };
    console.info("cidItemRenderer" + this.props.cidItem.cid);
  }
  // componentDidMount() {
  //     this.setState({
  //         item: this.props.cidItem
  //     });
  // }

  updateItemField(field: string, value: string, item: CidItem): CidItem {
    if (field === "cid") {
      item.cid = value;
    }
    return item;
  }
  enterEdit = (): void => {
    console.info("endterEdit");
    if (this.state.item != null) {
      console.info("endterEdit" + this.state.item.edit.toString());
      this.setState({ item: { ...this.state.item, edit: true } });
    }
  };
  cancelEdit = (): void => {
    this.setState({ item: { ...this.state.item, edit: false } });
  };
  handleChange = (e: ChangeEvent<HTMLInputElement>, field: string): void => {
    e.preventDefault();
    let updatedItem: CidItem = { ...this.state.item };
    updatedItem = this.updateItemField(field, e.target.value, updatedItem);
    console.info("updatedItem: " + updatedItem.cid + " " + e.target.value);
    this.setState({ item: updatedItem });
  };
  handleSave = (): void => {
    console.info("handleSave");
    this.setState({ item: { ...this.state.item, edit: false } });
    this.props.saveItem(this.state.item);
  };
  handleDelete = (): void => {
    console.info("handleDelete");
    this.props.deleteItem(this.state.item);
  };
  render(): JSX.Element {
    return (
      <div key={this.state.item.cid}>
        <ListGroup.Item>
          <Card>
            {this.state.item.edit ? (
              <Card.Body>
                <div className="k-hbox k-justify-content-between k-flex-wrap">
                  <div style={{ width: "65%", padding: "5 0" }}>
                    <label style={{ display: "block" }}>CID:</label>
                    <input
                      value={this.state.item.cid}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        this.handleChange(e, "cid")
                      }
                    />
                  </div>
                  <div style={{ width: "25%", padding: "5 0" }}>
                    <button
                      className="k-button k-primary"
                      style={{ marginRight: 5 }}
                      onClick={this.handleSave}
                    >
                      Save
                    </button>
                    <button className="k-button" onClick={this.cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              </Card.Body>
            ) : (
              <Card.Body>
                <div className="k-hbox k-justify-content-between k-flex-wrap">
                  <div style={{ width: "65%", padding: "5 0" }}>
                    <Card.Text style={{ fontSize: 16 }}>
                      {this.state.item.cid}
                    </Card.Text>
                  </div>
                  <div style={{ width: "15%", padding: "5 0" }}>
                    <Button
                      variant="primary"
                      className="k-button "
                      style={{ marginRight: 5 }}
                      onClick={this.enterEdit}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      className="k-button"
                      onClick={this.handleDelete}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card.Body>
            )}
          </Card>
        </ListGroup.Item>
      </div>
    );
  }
}

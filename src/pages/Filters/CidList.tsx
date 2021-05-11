import React from "react";
import { ListGroup } from "react-bootstrap";
import CidItemRender from "./CidItemRenderer";
import { CidItem, CidListProps } from "./Interfaces";

export default class CidList extends React.Component<CidListProps> {
  render(): JSX.Element {
    return (
      <ListGroup style={{ width: "100%", height: 500 }}>
        {this.props.cids.map((cidItem: CidItem, index: number) => (
          <CidItemRender
            key={index.toString()}
            cidItem={cidItem}
            saveItem={this.props.saveItem}
            deleteItem={this.props.deleteItem}
          />
        ))}
      </ListGroup>
    );
  }
}

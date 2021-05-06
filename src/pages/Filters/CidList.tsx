import React from "react";
import { ListGroup } from "react-bootstrap";
import CidItemRender from "./CidItemRenderer";
import { CidItem } from "./Interfaces";

export default class CidList extends React.Component<any, any> {
    render() {
        return (
            <ListGroup style={{ width: "100%", height: 500 }}>
                {this.props.cids.map((cidItem: CidItem, index: bigint) => (
                    <CidItemRender cidItem={cidItem} saveItem={this.props.saveItem} deleteItem={this.props.deleteItem}
                    />
                ))}
            </ListGroup>
        );
    }
}

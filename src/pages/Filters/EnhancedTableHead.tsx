import {
  Checkbox,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@material-ui/core";
import React from "react";
import { HeadCell } from "../Public/Interfaces";
import { Order } from "./Interfaces";

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

interface EnhancedTableProps<T> {
  onRequestSort: (event: React.MouseEvent<unknown>, property: keyof T) => void;
  headCells: HeadCell<T>[];
  enableChecking?: boolean;
  checkedCount?: number;
  itemsCount?: number;
  onMainCheckboxToggle?: () => void;
  order: Order;
  orderBy: string;
  rowCount: number;
  mySort: string;
  mySortBy: string;
}

export default function EnhancedTableHead<T>(props: EnhancedTableProps<T>) {
  const { order, orderBy, rowCount, onRequestSort, mySort, mySortBy } = props;
  const createSortHandler =
    (property: keyof T) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow
        // key={cid.tableKey}
        // hover
        // onClick={() => onRowToggle()}
        role="checkbox"
        tabIndex={-1}
        // style={}
        // key={cid.tableKey}
        // selected={!!cid.isChecked}
      >
        {props.enableChecking ? (
          <TableCell align="left">
            {/* <Checkbox
              indeterminate={
                !!props.checkedCount &&
                !!props.itemsCount &&
                props.checkedCount < props.itemsCount
              }
              checked={
                !!props.checkedCount &&
                !!props.itemsCount &&
                props.checkedCount === props.itemsCount
              }
              onChange={props?.onMainCheckboxToggle}
            /> */}
          </TableCell>
        ) : (
          <></>
        )}
        {props.headCells.map((headCell, idx) => (
          <TableCell
            style={{ verticalAlign: "middle" }}
            align={props.headCells.length - 1 === idx ? "right" : "left"}
            padding="normal"
            key={headCell.id as string}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <span style={{ display: "none" }}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </span>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

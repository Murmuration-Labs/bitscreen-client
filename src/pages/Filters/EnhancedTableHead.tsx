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
  const {
    order,
    orderBy,
    rowCount,
    onRequestSort,
    mySort,
    mySortBy,
    onMainCheckboxToggle,
    checkedCount,
    itemsCount,
  } = props;
  const createSortHandler =
    (property: keyof T) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  let indeterminate = false;
  let checked = false;

  if (itemsCount && checkedCount && checkedCount > 0) {
    if (itemsCount > checkedCount) {
      indeterminate = true;
      checked = false;
    } else {
      indeterminate = false;
      checked = true;
    }
  }

  return (
    <TableHead>
      <TableRow role="checkbox" tabIndex={-1}>
        {props.enableChecking ? (
          <TableCell padding="checkbox">
            <Checkbox
              indeterminate={indeterminate}
              checked={checked}
              onChange={onMainCheckboxToggle}
            />
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
              {headCell.info ? headCell.info : <></>}
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

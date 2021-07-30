import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { CidItem, FilterList } from "../Interfaces";
import CidsRow from "./CidsRow";

export interface CidsTableProps {
  filter: FilterList;
  cids: CidItem[];
  checkedCids: CidItem[];
  onMainCheckboxToggle: () => void;
  onCheckboxToggle: (index: number) => void;
  onEditClick: (index: number) => void;
  onMoveClick: (index: number) => void;
  onDeleteClick: (index: number) => void;
}

export interface HeadCell {
  pos: number;
  id: string;
  label: string;
}

const defaultHeadCells: HeadCell[] = [
  { pos: 0, id: "cid", label: "CID" },
  { pos: 1, id: "refUrl", label: "URL" },
  { pos: 999, id: "actions", label: "Actions" },
];

const overrideHeadCells: HeadCell[] = [
  { pos: 2, id: "remote", label: "Remote" },
  { pos: 3, id: "local", label: "Local" },
];

const CidsTable = ({
  filter,
  cids,
  checkedCids,
  onMainCheckboxToggle,
  onCheckboxToggle,
  onEditClick,
  onMoveClick,
  onDeleteClick,
}: CidsTableProps): JSX.Element => {
  const [headCells, setHeadCells] = useState(defaultHeadCells);

  useEffect(() => {
    const sorted = [
      ...defaultHeadCells,
      ...(filter.override ? overrideHeadCells : []),
    ].sort((a, b) => a.pos - b.pos);

    setHeadCells(sorted);
  }, [filter.override]);

  return (
    <TableContainer>
      <Table size={"small"}>
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={
                  checkedCids.length > 0 && checkedCids.length < cids.length
                }
                checked={
                  !!checkedCids.length && checkedCids.length === cids.length
                }
                onChange={() => onMainCheckboxToggle()}
              />
            </TableCell>
            {headCells.map((headCell) => (
              <TableCell key={headCell.id} align={"left"}>
                <TableSortLabel active={false} direction={"asc"}>
                  {headCell.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {cids.map((row, index) => {
            return (
              <CidsRow
                key={index}
                filter={filter}
                cid={row}
                onRowToggle={() => onCheckboxToggle(index)}
                onEditClick={() => onEditClick(index)}
                onMoveClick={() => onMoveClick(index)}
                onDeleteClick={() => onDeleteClick(index)}
              ></CidsRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CidsTable;

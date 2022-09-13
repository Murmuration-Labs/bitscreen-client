import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { CidItem, Conflict, FilterList, Visibility } from '../Interfaces';
import CidsRow from './CidsRow/CidsRow';

export interface CidsTableProps {
  filter: FilterList;
  cids: CidItem[];
  checkedCids: CidItem[];
  onMainCheckboxToggle: () => void;
  onCheckboxToggle: (index: number) => void;
  onEditClick: (index: number) => void;
  onMoveClick: (index: number) => void;
  onDeleteClick: (index: number) => void;
  setConflict: (conflicts: Conflict[]) => void;
  totalConflicts: Conflict[];
  setShowConflict: (showConflict: {
    single: boolean;
    multiple: boolean;
  }) => void;
  addConflicts: (conflicts: Conflict[]) => void;
  removeConflict: (conflict: string) => void;
  conflictsChanged: boolean;
}

export interface HeadCell {
  pos: number;
  id: string;
  label: string;
  align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
}

const defaultHeadCells: HeadCell[] = [
  { pos: 0, id: 'cid', label: 'CID' },
  { pos: 1, id: 'refUrl', label: 'URL' },
  { pos: 2, id: 'created', label: 'Added' },
  { pos: 3, id: 'local', label: 'Local' },
  { pos: 999, id: 'actions', label: '', align: 'right' },
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
  setConflict,
  totalConflicts,
  setShowConflict,
  addConflicts,
  removeConflict,
  conflictsChanged,
}: CidsTableProps): JSX.Element => {
  const [headCells, setHeadCells] = useState(defaultHeadCells);

  useEffect(() => {
    const headCells = [...defaultHeadCells];

    headCells.find((e) => e.id === 'local')!.label = totalConflicts.length
      ? 'Problem'
      : 'Local';

    console.log(totalConflicts);

    const sorted = [...headCells].sort((a, b) => a.pos - b.pos);

    setHeadCells(sorted);
  }, [filter.visibility, totalConflicts]);

  return (
    <TableContainer key={String(conflictsChanged)}>
      <Table size={'small'} stickyHeader>
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
              <TableCell key={headCell.id} align={headCell.align || 'left'}>
                <TableSortLabel active={false} direction={'asc'}>
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
                setConflict={setConflict}
                setShowConflict={setShowConflict}
                addConflicts={addConflicts}
                removeConflict={removeConflict}
              ></CidsRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CidsTable;

import {
  Checkbox,
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
} from "@material-ui/core";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import ApiService from "../../../services/ApiService";
import { CidItem, Conflict, FilterList, Visibility } from "../Interfaces";
import { formatDate } from "../utils";
import * as icons from "../../../resources/icons";
import "./cids.css";
import { Badge, Button } from "react-bootstrap";
import { ErrorOutline } from "@material-ui/icons";
import LoggerService from "../../../services/LoggerService";
import { toast } from "react-toastify";
import { CID } from "multiformats/cid";

export interface CidsRowProps {
  filter: FilterList;
  cid: CidItem;
  onRowToggle: () => void;
  onEditClick: () => void;
  onMoveClick: () => void;
  onDeleteClick: () => void;
  setConflict: (conflicts: Conflict[]) => void;
  setShowConflict: (show: boolean) => void;
  addConflicts: (conflicts: Conflict[]) => void;
  removeConflict: (conflict: string) => void;
}

interface ExceptionProps {
  loading: boolean;
  conflicts: Conflict[];
  handleConflict: (conflicts: Conflict[]) => void;
}

const LocalException = ({
  loading,
  conflicts,
  handleConflict,
}: ExceptionProps) => {
  if (!conflicts.length) return <></>;

  return (
    <>
      {loading ? (
        <PuffLoader color={"#28a745"} size={20} />
      ) : (
        <>
          <ErrorOutline />
          <Button
            size="sm"
            className={"text-dim local-conflict"}
            style={{ color: "blue", fontSize: 14, marginLeft: -16 }}
            onClick={(e) => {
              e.stopPropagation();
              handleConflict(conflicts);
            }}
            variant="muted"
          >
            Local conflict
          </Button>
        </>
      )}
    </>
  );
};

const CidsRow = ({
  filter,
  cid,
  onRowToggle,
  onEditClick,
  onMoveClick,
  onDeleteClick,
  setShowConflict,
  setConflict,
  addConflicts,
  removeConflict,
}: CidsRowProps): JSX.Element => {
  const [exceptionLoading, setExceptionLoading] = useState(false);
  const [localConflicts, setLocalConflicts] = useState<Conflict[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isValid, setIsValid] = useState<boolean>(true);

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const cidString = cid.cid;
    try {
      const parsed = CID.parse(cidString);
      setIsValid(true);
    } catch (e) {
      setIsValid(false);
    }
  }, [cid]);

  useEffect(() => {
    if (filter.visibility === Visibility.Exception) {
      console.log("paternite");
      ApiService.getCidConflict(cid.cid, filter.id, true)
        .then((conflicts) => {
          setLocalConflicts(conflicts);
          addConflicts(conflicts);
        })
        .catch((e) => {
          if (e.status === 401) {
            toast.error(e.data.message);
            return;
          }
          LoggerService.error(e);
        })
        .finally(() => setExceptionLoading(false));
      return;
    } else {
      console.log("maternite");
      ApiService.getCidConflict(cid.cid, filter.id, false)
        .then((conflicts) => {
          setLocalConflicts(conflicts);
          addConflicts(conflicts);
        })
        .catch((e) => {
          if (e.status === 401) {
            toast.error(e.data.message);
            return;
          }
          LoggerService.error(e);
        })
        .finally(() => setExceptionLoading(false));
    }

    setExceptionLoading(false);
  }, [filter.id, filter.visibility, cid.cid]);

  useEffect(() => {
    if (localConflicts.length > 0) {
      return () => removeConflict(cid.cid);
    }
  }, [localConflicts]);

  const handleEdit = (): void => onEditClick();
  const handleMove = (): void => onMoveClick();
  const handleDelete = (): void => onDeleteClick();

  const handleConflict = (conflicts: Conflict[]) => {
    setConflict(conflicts);
    setShowConflict(true);
  };

  return (
    <TableRow
      hover
      onClick={() => onRowToggle()}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="checkbox"
      tabIndex={-1}
      key={cid.tableKey}
      selected={!!cid.isChecked}
      className=".cids-table-row"
    >
      <TableCell padding="checkbox">
        <Checkbox checked={!!cid.isChecked} />
      </TableCell>
      <TableCell
        style={{ wordWrap: "break-word" }}
        component="th"
        id={cid.tableKey}
        scope="row"
        aria-label="CID Name Cell"
      >
        {cid.cid.length > 10 ? (
          <Tooltip title={cid.cid}>
            <a
              className="table-row-cell-text"
              style={{ fontSize: "1rem", cursor: "pointer" }}
              onClick={(e) => {
                e.stopPropagation();
                switch (true) {
                  case !!navigator.clipboard:
                    // eslint-disable-next-line no-case-declarations
                    const selBox = document.createElement("textarea");
                    selBox.style.position = "fixed";
                    selBox.style.left = "0";
                    selBox.style.top = "0";
                    selBox.style.opacity = "0";
                    selBox.value = cid.cid;
                    document.body.appendChild(selBox);
                    selBox.focus();
                    selBox.select();
                    document.execCommand("copy");
                    document.body.removeChild(selBox);
                    break;
                  default:
                    navigator.clipboard.writeText(cid.cid);
                }
                enqueueSnackbar("Copied to clipboard.", {
                  variant: "success",
                  preventDuplicate: true,
                  anchorOrigin: {
                    horizontal: "right",
                    vertical: "top",
                  },
                });
              }}
            >{`${cid.cid.slice(0, 10)}...`}</a>
          </Tooltip>
        ) : (
          <a
            className="table-row-cell-text"
            style={{ fontSize: "1rem", cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(cid.cid);
              enqueueSnackbar("Copied to clipboard.", {
                variant: "success",
                preventDuplicate: true,
                anchorOrigin: {
                  horizontal: "right",
                  vertical: "top",
                },
              });
            }}
          >
            {cid.cid}
          </a>
        )}
        {!isValid && (
          <Badge style={{ marginLeft: 10 }} variant="danger">
            Invalid CID
          </Badge>
        )}
      </TableCell>
      <TableCell align="left">
        {cid.refUrl && (
          <a
            className="table-row-cell-text"
            style={{ fontSize: "1rem" }}
            href={
              cid.refUrl
                ? cid.refUrl.toLowerCase().startsWith("http")
                  ? cid.refUrl
                  : `https://${cid.refUrl}`
                : cid.refUrl
            }
            target="_blank"
            onClick={(e) => e.stopPropagation()}
          >
            {cid.refUrl.length > 30
              ? `${cid.refUrl.slice(0, 30)}...`
              : cid.refUrl}
          </a>
        )}
      </TableCell>
      <TableCell align="left">
        <a
          className="table-row-cell-text"
          style={{ fontSize: "1rem" }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {formatDate(cid.created)}
        </a>
      </TableCell>
      <TableCell>
        <LocalException
          loading={exceptionLoading}
          conflicts={localConflicts}
          handleConflict={handleConflict}
        />
      </TableCell>
      <TableCell align="right">
        <Tooltip title="Edit">
          <IconButton
            className="cid-row-icon"
            aria-label="Edit CID"
            id="edit-cid-button"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
          >
            <img src={icons.editIcon}></img>
          </IconButton>
        </Tooltip>
        {typeof filter.id === "number" &&
          filter.visibility !== Visibility.Exception && (
            <Tooltip title="Move">
              <IconButton
                className="cid-row-icon move-icon"
                id="move-cid-button"
                aria-label="Move CID"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMove();
                }}
              >
                <img src={icons.moveIcon}></img>
              </IconButton>
            </Tooltip>
          )}
        <Tooltip title="Delete">
          <IconButton
            aria-label="Delete CID"
            id="delete-cid-button"
            className="cid-row-icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <img src={icons.deleteIcon}></img>
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

export default CidsRow;

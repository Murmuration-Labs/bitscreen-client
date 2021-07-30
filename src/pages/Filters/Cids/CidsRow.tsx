import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faCheck,
  faEdit,
  faShare,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Checkbox,
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
} from "@material-ui/core";
import React, { useEffect, useState } from "react";
import PuffLoader from "react-spinners/PuffLoader";
import ApiService from "../../../services/ApiService";
import { CidItem, FilterList } from "../Interfaces";

export interface CidsRowProps {
  filter: FilterList;
  cid: CidItem;
  onRowToggle: () => void;
  onEditClick: () => void;
  onMoveClick: () => void;
  onDeleteClick: () => void;
}

interface OverrideProps {
  loading: boolean;
  override: boolean;
}

const OverrideTemplate = ({ text, color }: any) => {
  return (
    <Tooltip arrow title={text} PopperProps={{}}>
      <IconButton onClick={(e) => e.stopPropagation()}>
        <FontAwesomeIcon icon={faCheck as IconProp} color={color} />
      </IconButton>
    </Tooltip>
  );
};

const RemoteOverride = ({ loading, override }: OverrideProps) => {
  if (!override) return <></>;

  return (
    <>
      {loading ? (
        <PuffLoader color={"#28a745"} size={20} />
      ) : (
        <OverrideTemplate
          text="This CID overrides the one in imported filter"
          color="#28a745"
        ></OverrideTemplate>
      )}
    </>
  );
};

const LocalOverride = ({ loading, override }: OverrideProps) => {
  if (!override) return <></>;

  return (
    <>
      {loading ? (
        <PuffLoader color={"#28a745"} size={20} />
      ) : (
        <OverrideTemplate
          text={`This CID is already in a local filter, please remove the CID from the local filter instead of adding it to an override list`}
          color="#ffc107"
        ></OverrideTemplate>
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
}: CidsRowProps): JSX.Element => {
  const [overrideLoading, setOverrideLoading] = useState(false);
  const [remote, setRemote] = useState(false);
  const [local, setLocal] = useState(false);

  useEffect(() => {
    if (filter.override) {
      ApiService.getCidOverride(cid.cid, filter.id)
        .then(({ remote, local }) => {
          setRemote(remote);
          setLocal(local);
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => setOverrideLoading(false));
      return;
    }

    setOverrideLoading(false);
  }, [filter.id, filter.override, cid.cid]);

  const handleEdit = (): void => onEditClick();
  const handleMove = (): void => onMoveClick();
  const handleDelete = (): void => onDeleteClick();

  return (
    <TableRow
      hover
      onClick={() => onRowToggle()}
      role="checkbox"
      tabIndex={-1}
      key={cid.tableKey}
      selected={!!cid.isChecked}
    >
      <TableCell padding="checkbox">
        <Checkbox checked={!!cid.isChecked} />
      </TableCell>
      <TableCell
        style={{ wordWrap: "break-word" }}
        component="th"
        id={cid.tableKey}
        scope="row"
      >
        {cid.cid}
      </TableCell>
      <TableCell align="left">
        {cid.refUrl && (
          <a
            style={{ fontSize: "1rem" }}
            href={cid.refUrl}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
          >
            {cid.refUrl.length > 30
              ? `${cid.refUrl.slice(0, 30)}...`
              : cid.refUrl}
          </a>
        )}
      </TableCell>
      {filter.override && (
        <>
          <TableCell>
            <RemoteOverride
              loading={overrideLoading}
              override={remote}
            ></RemoteOverride>
          </TableCell>
          <TableCell>
            <LocalOverride
              loading={overrideLoading}
              override={local}
            ></LocalOverride>
          </TableCell>
        </>
      )}
      <TableCell>
        <Tooltip title="Edit">
          <IconButton
            aria-label="Edit CID"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
          >
            <FontAwesomeIcon color="rgb(0,121,251)" icon={faEdit} />
          </IconButton>
        </Tooltip>
        {typeof filter.id === "number" && (
          <Tooltip title="Move">
            <IconButton
              aria-label="Move CID"
              onClick={(e) => {
                e.stopPropagation();
                handleMove();
              }}
            >
              <FontAwesomeIcon color="orange" icon={faShare} />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Delete">
          <IconButton
            aria-label="Delete CID"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <FontAwesomeIcon color={"red"} size={"xs"} icon={faTrash} />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

export default CidsRow;

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { Conflict, ConflictModalProps } from "../Interfaces";
import { ListGroup } from "react-bootstrap";
import ApiService from "../../../services/ApiService";
import LoggerService from "../../../services/LoggerService";

const resolveConflict = (conflicts: Conflict[]) => {
  return Promise.all(
    conflicts.map((conflict) => ApiService.deleteCidById(conflict.id))
  );
};

const ConflictModal = ({
  show,
  conflicts,
  handleClose,
  removeConflict,
}: ConflictModalProps): JSX.Element => {
  const [multiple, setMultiple] = useState<boolean>(false);

  useEffect(() => {
    if (show) {
      LoggerService.info("Show Conflict modal");
    }
  }, [show]);

  useEffect(() => {
    const cidsFound: string[] = [];

    for (const conflict of conflicts) {
      if (cidsFound.includes(conflict.cid)) {
        continue;
      }

      cidsFound.push(conflict.cid);
    }

    LoggerService.debug(cidsFound);
    if (cidsFound.length > 1) {
      setMultiple(true);
    } else {
      setMultiple(false);
    }
  }, [conflicts]);

  return (
    <>
      <Dialog open={show && !multiple} onClose={() => handleClose(false)}>
        <DialogContent style={{ display: "flex", flexDirection: "column" }}>
          This CID appears on {conflicts.length} local filter list/s. Do you
          want to remove it there?
          <ListGroup>
            {conflicts.map((conflict) => {
              return (
                <ListGroup.Item
                  as="li"
                  className="d-flex justify-content-between align-items-start"
                  key={conflict.id}
                >
                  <div className="cid-conflict-url">
                    <div className="cid-conflict-title">{conflict.cid}</div>
                    {conflict.refUrl}
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </DialogContent>
        <DialogActions>
          <Button
            aria-label="add-cid"
            color="primary"
            onClick={() => {
              resolveConflict(conflicts).then(() => {
                conflicts.forEach((conflict) => {
                  removeConflict(conflict.cid);
                });
                handleClose(false);
              });
            }}
          >
            Yes
          </Button>
          <Button
            aria-label="cancel"
            color="primary"
            title="Cancel"
            onClick={() => handleClose(false)}
          >
            No
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={show && multiple} onClose={() => handleClose(false)}>
        <DialogContent style={{ display: "flex", flexDirection: "column" }}>
          <p className="conflict-modal-text">
            The following CID(s) in this list are in conflict with a local
            filter and cannot be saved.
          </p>
          <ListGroup>
            {conflicts.map((conflict) => {
              return (
                <ListGroup.Item
                  as="li"
                  className="d-flex justify-content-between align-items-start"
                  key={conflict.id}
                >
                  <div className="cid-conflict-url">
                    <div className="cid-conflict-title">{conflict.cid}</div>
                    {conflict.refUrl}
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
          <p className="conflict-modal-text">
            Do you want to remove them from the local lists?
          </p>
        </DialogContent>
        <DialogActions>
          <Button
            aria-label="add-cid"
            color="primary"
            onClick={() => {
              resolveConflict(conflicts);
              handleClose(false);
            }}
          >
            Yes
          </Button>
          <Button
            aria-label="cancel"
            color="primary"
            title="Cancel"
            onClick={() => handleClose(false)}
          >
            No
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ConflictModal;

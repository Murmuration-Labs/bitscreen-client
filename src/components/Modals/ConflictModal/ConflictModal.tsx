import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  makeStyles,
} from '@material-ui/core';
import { Conflict, ConflictModalProps } from 'pages/Filters/Interfaces';
import React, { useEffect, useState } from 'react';
import { ListGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ApiService from 'services/ApiService';
import LoggerService from 'services/LoggerService';

const resolveConflict = async (conflicts: Conflict[]) => {
  try {
    await Promise.all(
      conflicts.map((conflict) => ApiService.deleteCidById(conflict.id))
    );
  } catch (e: any) {
    if (e && e.status === 401) {
      toast.error(e.data.message);
      return;
    }
  }
  return;
};

const useStyles = makeStyles(() => ({
  paperResolveOneConflict: { maxWidth: '400px', borderRadius: '16px' },
  paperResolveMultipleConflict: { maxWidth: '480px', borderRadius: '16px' },
  root: { padding: '24px' },
}));

const ConflictModal = ({
  showConflict,
  conflicts,
  setShowConflict,
  removeConflict,
}: ConflictModalProps): JSX.Element => {
  const classes = useStyles();
  const [multiple, setMultiple] = useState<boolean>(false);

  useEffect(() => {
    if (showConflict) {
      LoggerService.info('Show Conflict modal');
    }
  }, [showConflict]);

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
      <Dialog
        classes={{ paper: classes.paperResolveOneConflict }}
        open={showConflict.single}
        onClose={() =>
          setShowConflict({
            single: false,
            multiple: false,
          })
        }
      >
        <DialogContent style={{ display: 'flex', flexDirection: 'column' }}>
          This CID appears on one or more local filter lists. Do you want to
          remove it there?
        </DialogContent>
        <DialogActions classes={{ root: classes.root }}>
          <Button
            aria-label="cancel"
            className="app-primary-button text-white no-text-transform"
            color="primary"
            title="Cancel"
            onClick={() =>
              setShowConflict({
                single: false,
                multiple: false,
              })
            }
          >
            No
          </Button>
          <Button
            aria-label="add-cid"
            color="primary"
            className="app-primary-button text-white no-text-transform"
            onClick={() => {
              resolveConflict(conflicts).then(() => {
                conflicts.forEach((conflict) => {
                  removeConflict(conflict.cid);
                });
                setShowConflict({
                  single: false,
                  multiple: false,
                });
              });
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        classes={{ paper: classes.paperResolveOneConflict }}
        open={showConflict.multiple}
        onClose={() =>
          setShowConflict({
            single: false,
            multiple: false,
          })
        }
      >
        <DialogContent style={{ display: 'flex', flexDirection: 'column' }}>
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
        <DialogActions classes={{ root: classes.root }}>
          <Button
            aria-label="add-cid"
            color="primary"
            onClick={() => {
              resolveConflict(conflicts);
              setShowConflict({
                single: false,
                multiple: false,
              });
            }}
          >
            Yes
          </Button>
          <Button
            aria-label="cancel"
            color="primary"
            title="Cancel"
            onClick={() =>
              setShowConflict({
                single: false,
                multiple: false,
              })
            }
          >
            No
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ConflictModal;

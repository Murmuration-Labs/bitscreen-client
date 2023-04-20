import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  makeStyles,
} from '@material-ui/core';
import { Conflict, ConflictModalProps } from 'pages/Filters/Interfaces';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import ApiService from 'services/ApiService';
import LoggerService from 'services/LoggerService';

const resolveConflict = async (conflicts: Conflict[]) => {
  const filtersCidsPairs: {
    [key: number]: number[];
  } = {};

  for (const conflict of conflicts) {
    const filters = conflict.filters;
    for (const filter of filters) {
      filtersCidsPairs[`${filter['id']}`] = [];
      filtersCidsPairs[`${filter['id']}`].push(conflict.id);
    }
  }

  try {
    await Promise.all(
      Object.keys(filtersCidsPairs).map((filterId) =>
        ApiService.removeConflictedCids(filtersCidsPairs[`${filterId}`], [
          parseInt(filterId),
        ])
      )
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
  paperResolveMultipleConflict: { maxWidth: '600px', borderRadius: '16px' },
  root: { padding: '24px' },
  rootContent: { padding: '24px 24px 0 24px !important' },
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
            className="app-primary-button text-white no-text-transform small-button"
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
            className="app-primary-button text-white no-text-transform small-button"
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
        classes={{ paper: classes.paperResolveMultipleConflict }}
        open={showConflict.multiple}
        onClose={() =>
          setShowConflict({
            single: false,
            multiple: false,
          })
        }
      >
        <DialogContent
          classes={{ root: classes.rootContent }}
          style={{ display: 'flex', flexDirection: 'column', width: '600px' }}
        >
          <p className="conflict-modal-text">
            The following CID(s) in this list are in conflict with one or more
            local filter lists and cannot be saved.
          </p>
          <div className="text-overflow content">
            {conflicts
              .filter(
                (e, index) =>
                  conflicts.findIndex((el) => el.cid === e.cid) === index
              )
              .map((conflict) => {
                return (
                  <div className="cid-conflict-url">
                    <div className="cid-conflict-title">{conflict.cid}</div>
                    {conflict.refUrl || 'URL N/A'}
                  </div>
                );
              })}
          </div>
          <div className="conflict-modal-text">
            Do you want to remove them from the local lists?
          </div>
        </DialogContent>
        <DialogActions classes={{ root: classes.root }}>
          <Button
            aria-label="cancel"
            color="primary"
            title="Cancel"
            className="app-primary-button text-white no-text-transform small-button"
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
            className="app-primary-button text-white no-text-transform small-button"
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
    </>
  );
};

export default ConflictModal;

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { CidItem } from '../Interfaces';
import LoggerService from 'services/LoggerService';

interface AddCidModalProps {
  cid: CidItem;
  index: number;
  edit: boolean;
  open: boolean;
  handleClose: (cid?: CidItem, index?: number) => void;
}

const AddCidModal = ({
  cid,
  index,
  edit,
  open,
  handleClose,
}: AddCidModalProps): JSX.Element => {
  const [cidClone, setCidClone] = useState<CidItem>({ ...cid });

  useEffect(() => {
    if (open) {
      LoggerService.info('Show add CID modal');
    }
  }, [open]);

  useEffect(() => {
    setCidClone(cid);
  }, [cid]);

  if (!cid || !open) {
    return <></>;
  }

  return (
    <Dialog open={open} onClose={() => handleClose()}>
      <DialogTitle>{edit ? 'Update CID' : 'Add CID'}</DialogTitle>
      <DialogContent style={{ display: 'flex', flexDirection: 'column' }}>
        <form
          onKeyPress={(e) =>
            e.nativeEvent.code === 'Enter' && cidClone.cid
              ? handleClose(cidClone, index)
              : null
          }
        >
          <TextField
            variant="outlined"
            autoFocus
            required
            margin="dense"
            id="cid"
            label="CID"
            fullWidth
            value={cidClone.cid}
            onChange={(e) => {
              setCidClone({ ...cidClone, cid: e.target.value });
            }}
          ></TextField>
          <TextField
            variant="outlined"
            margin="dense"
            id="url"
            label="Public Complaint URL (Optional)"
            placeholder="Public Complaint URL (Optional)"
            fullWidth
            value={cidClone.refUrl}
            onChange={(e) => {
              setCidClone({ ...cidClone, refUrl: e.target.value });
            }}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button
          aria-label="add-cid"
          color="primary"
          disabled={!cidClone.cid}
          onClick={() => handleClose(cidClone, index)}
        >
          {edit ? 'Update' : 'Add'}
        </Button>
        <Button
          aria-label="cancel"
          color="primary"
          title="Cancel"
          onClick={() => handleClose()}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCidModal;

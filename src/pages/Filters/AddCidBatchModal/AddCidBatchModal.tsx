import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import '../Filters.css';
import { AddCidBatchModalProps } from '../Interfaces';
import LoggerService from 'services/LoggerService';
import './AddCidBatchModal.css';

export const AddCidBatchModal = (props: AddCidBatchModalProps): JSX.Element => {
  const [cidsInput, setCidsInput] = useState<string>('');
  const [cidsInputError, setCidsInputError] = useState<boolean>(false);
  const [refUrl, setRefUrl] = useState<string>('');
  const [edit] = useState(!!props.edit);
  const [open] = useState(props.show);

  useEffect(() => {
    if (open) {
      LoggerService.info('Show add CID Batch modal');
    }
  }, [open]);

  const handleCids = (isEdit): void => {
    let result: string[] = [];
    if (!isEdit) {
      result = cidsInput
        .trim()
        .replace(/^[,;\s]+|[,;\s]+$/g, '')
        .split(/[,;\s]/)
        .filter((x) => x.length)
        .map((element: string) => {
          return element.trim();
        });
    }
    props.closeCallback({ result, refUrl });
    setRefUrl('');
  };

  return (
    <Dialog open={open}>
      <DialogTitle>{edit ? 'Update CIDs Batch' : 'Add CIDs Batch'}</DialogTitle>
      <DialogContent style={{ display: 'flex', flexDirection: 'column' }}>
        <form
          style={{ minWidth: '400px' }}
          onKeyPress={(e) => {
            if (e.nativeEvent.code === 'Enter' && (edit || cidsInput))
              handleCids(edit);
          }}
        >
          {!edit && (
            <TextField
              variant="outlined"
              autoFocus
              margin="dense"
              id="cid"
              label="CIDs"
              placeholder="CID_1,CID_2,CID_3"
              multiline
              maxRows={6}
              fullWidth
              value={cidsInput}
              className="add-batch-cid-input"
              onChange={(e) => {
                setCidsInput(e.target.value);
              }}
            ></TextField>
          )}
          <TextField
            variant="outlined"
            margin="dense"
            id="url"
            label="URL"
            placeholder="Public Complaint URL (Optional)"
            fullWidth
            value={refUrl}
            onChange={(e) => {
              setRefUrl(e.target.value);
            }}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button
          color="primary"
          aria-label="add cids"
          disabled={!edit && !cidsInput}
          onClick={() => handleCids(edit)}
        >
          {edit ? 'Update' : 'Add'}
        </Button>
        <Button
          color="primary"
          aria-label="cancel"
          onClick={() => props.closeCallback(null)}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCidBatchModal;

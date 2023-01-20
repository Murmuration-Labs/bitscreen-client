import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  makeStyles,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { Alert, Button, Form, FormControl, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ApiService from 'services/ApiService';
import { getAccount, getLoginType } from 'services/AuthService';
import LoggerService from 'services/LoggerService';
import { Account, LoginType } from 'types/interfaces';

interface DeleteAccountModalProps {
  show: boolean;
  handleClose: (result: boolean) => void;
}

const useStyles = makeStyles(() => ({
  paper: { maxWidth: '850px' },
}));

const DeleteAccountModal = ({
  show,
  handleClose,
}: DeleteAccountModalProps): JSX.Element => {
  const classes = useStyles();
  const account = getAccount() as Account;
  const [confirmText, setConfirmText] = useState<string>('');
  const [toComplete, setToComplete] = useState<string>('');
  const [hasUsedFilters, setHasUsedFilters] = useState<boolean>(false);
  const loginType = getLoginType();

  useEffect(() => {
    if (show) {
      LoggerService.info('Showing Delete account modal.');
      ApiService.getFilters(0, 100, 'asc', 'name', '').then(
        ({ count, filters }) => {
          for (const filter of filters) {
            if (
              filter &&
              filter.provider.id === account?.id &&
              filter.provider_Filters &&
              filter.provider_Filters.length > 1
            ) {
              setHasUsedFilters(true);
              return;
            }
          }

          setHasUsedFilters(false);
        },
        (e) => {
          if (e && e.status === 401) {
            toast.error(e.data.message);
            return;
          }
        }
      );
    }
  }, [show]);

  useEffect(() => {
    if (!account?.walletAddress) return;
    setToComplete(account?.walletAddress);
  }, [account]);

  const confirmDelete = () => {
    if (
      loginType === LoginType.Email ||
      (loginType === LoginType.Wallet &&
        confirmText === account?.walletAddress?.slice(-4))
    ) {
      toast.success('Account deletion initiated.');
      ApiService.deleteProvider(account).then(
        (response) => {
          setConfirmText('');
          handleClose(response.success);
        },
        (e) => {
          if (e && e.status === 401) {
            toast.error(e.data.message);
            return;
          }
        }
      );
    } else {
      LoggerService.error("Confirmation text doesn't match wallet.");
    }
  };

  return (
    <>
      <Dialog
        classes={{ paper: classes.paper }}
        open={show}
        onClose={() => handleClose(false)}
      >
        <DialogTitle>Delete account</DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column' }}>
          <Form>
            <Form.Row>
              <Alert style={{ marginRight: 10 }} variant="danger">
                This action is irreversible. If you did not export your account
                data prior to deleting, you will not be able to recover your
                data.
              </Alert>
              {hasUsedFilters && (
                <Alert style={{ marginRight: 10 }} variant="danger">
                  Some of your lists are currently in use by other subscribers.
                  Deleting your account will also remove the lists from their
                  accounts.
                </Alert>
              )}
              {account && loginType === LoginType.Wallet && (
                <InputGroup className="mb-2">
                  <InputGroup.Prepend>
                    <InputGroup.Text className="w-100">
                      {toComplete}
                    </InputGroup.Text>
                  </InputGroup.Prepend>
                  <FormControl
                    type="text"
                    placeholder="Enter the last 4 characters of your wallet"
                    value={confirmText}
                    onChange={(ev) => setConfirmText(ev.target.value)}
                  />
                </InputGroup>
              )}
              {account && loginType === LoginType.Wallet && (
                <Form.Text className="text-muted">
                  To confirm that you want to delete this account, please input
                  the last 4 characters of your wallet address.
                </Form.Text>
              )}
            </Form.Row>
          </Form>
        </DialogContent>
        <DialogActions>
          <Button
            aria-label="cancel"
            color="primary"
            title="Cancel"
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmDelete}
            disabled={
              !!account &&
              !!account.walletAddress &&
              confirmText.toLowerCase() !== account?.walletAddress?.slice(-4)
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeleteAccountModal;

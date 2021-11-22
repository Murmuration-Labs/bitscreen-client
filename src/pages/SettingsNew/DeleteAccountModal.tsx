import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { Alert, Col, Form, FormControl, InputGroup } from "react-bootstrap";
import { getAccount } from "../../services/AuthService";
import { Account } from "../../types/interfaces";
import ApiService from "../../services/ApiService";
import LoggerService from "../../services/LoggerService";
import { toast } from "react-toastify";

interface DeleteAccountModalProps {
  show: boolean;
  handleClose: (result: boolean) => void;
}

const DeleteAccountModal = ({
  show,
  handleClose,
}: DeleteAccountModalProps): JSX.Element => {
  const [confirmText, setConfirmText] = useState<string>("");
  const [account, setAccount] = useState<Account | null>(getAccount());
  const [toComplete, setToComplete] = useState<string>("");
  const [hasUsedFilters, setHasUsedFilters] = useState<boolean>(false);

  useEffect(() => {
    if (show) {
      LoggerService.info("Showing Delete account modal.");
      ApiService.getFilters(0, 100, "asc", "name", "").then(
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
          if (e.status === 401) {
            toast.error(e.data.message);
            return;
          }
        }
      );
    }
  }, [show]);

  useEffect(() => {
    const cutAddress = account?.walletAddress?.slice(2, -5) || "";
    setToComplete(cutAddress + "...");
  }, [account]);

  const confirmDelete = () => {
    if (confirmText === account?.walletAddress?.slice(-5)) {
      ApiService.deleteProvider(account).then(
        (response) => {
          setConfirmText("");
          handleClose(response.success);
        },
        (e) => {
          if (e.status === 401) {
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
      <Dialog open={show} maxWidth="md" onClose={() => handleClose(false)}>
        <DialogTitle>Delete account</DialogTitle>
        <DialogContent style={{ display: "flex", flexDirection: "column" }}>
          <Alert variant="danger">
            This action is irreversible. If you did not export your account data
            prior to deleting, you will not be able to recover your data.
          </Alert>
          {hasUsedFilters && (
            <Alert variant="danger">
              Some of your lists are currently in use by other subscribers.
              Deleting your account will also remove the lists from their
              accounts.
            </Alert>
          )}
          <Form>
            <Form.Row>
              <InputGroup className="mb-2">
                <InputGroup.Prepend>
                  <InputGroup.Text>{toComplete}</InputGroup.Text>
                </InputGroup.Prepend>
                <FormControl
                  type="text"
                  placeholder="Enter the last 5 characters of your wallet"
                  onChange={(ev) => setConfirmText(ev.target.value)}
                />
              </InputGroup>
              <Form.Text className="text-muted">
                To confirm that you want to delete this account, please input
                the last 5 characters of your wallet address.
              </Form.Text>
            </Form.Row>
          </Form>
        </DialogContent>
        <DialogActions>
          <Button
            aria-label="add-cid"
            color="primary"
            onClick={confirmDelete}
            disabled={
              confirmText.toLowerCase() !== account?.walletAddress?.slice(-5)
            }
          >
            Delete
          </Button>
          <Button
            aria-label="cancel"
            color="primary"
            title="Cancel"
            onClick={() => handleClose(false)}
          >
            Abort
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeleteAccountModal;

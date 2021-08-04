import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@material-ui/core";
import React, { useState } from "react";
import { Button } from "react-bootstrap";
import "./Filters.css";
import { AddCidBatchModalProps } from "./Interfaces";

export const AddCidBatchModal = (props: AddCidBatchModalProps): JSX.Element => {
  const [cidsInput, setCidsInput] = useState<string>("");
  const [cidsInputError, setCidsInputError] = useState<boolean>(false);
  const [refUrl, setRefUrl] = useState<string>("");
  const [edit] = useState(!!props.edit);
  const [open] = useState(props.show);

  console.log(props.show);

  // const renderCidsInputError = (): JSX.Element => {
  //   if (cidsInputError) {
  //     return (
  //       <span className="double-space-left text-danger">Invalid CIDs list</span>
  //     );
  //   }

  //   return <></>;
  // };

  const addCids = (): void => {
    const match = /\r|\n|,|;|\s/.exec(cidsInput);
    if (!match) {
      setCidsInputError(true);
      return;
    }
    const result = cidsInput
      .trim()
      .split(match[0])
      .map((element: string) => {
        return element.trim();
      });
    setCidsInput("");
    props.closeCallback({ result, refUrl });
    setRefUrl("");
  };

  const updateCids = (): void => {
    props.closeCallback({ result: [], refUrl });
    setRefUrl("");
  };

  return (
    <Dialog open={open}>
      <DialogTitle>{edit ? "Update CIDs Batch" : "Add CIDs Batch"}</DialogTitle>
      <DialogContent style={{ display: "flex", flexDirection: "column" }}>
        <form
          style={{ minWidth: "400px" }}
          onKeyPress={(e) =>
            e.nativeEvent.code === "Enter" && (edit || cidsInput)
              ? edit
                ? updateCids()
                : addCids()
              : null
          }
        >
          {!edit && (
            <TextField
              variant="outlined"
              autoFocus
              margin="dense"
              id="cid"
              label="CID_1, CID_2, CID_3 etc."
              rows={2}
              multiline
              maxRows={6}
              fullWidth
              value={cidsInput}
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
          disabled={!edit && !cidsInput}
          onClick={() => (edit ? updateCids() : addCids())}
        >
          {edit ? "Update" : "Add"}
        </Button>
        <Button
          color="primary"
          title="Cancel"
          onClick={() => props.closeCallback(null)}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCidBatchModal;

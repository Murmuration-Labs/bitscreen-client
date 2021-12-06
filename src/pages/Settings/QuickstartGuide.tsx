import DeleteAccountModal from "./DeleteAccountModal";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  Link,
  List,
  ListItem,
  Typography,
} from "@material-ui/core";
import React from "react";
import { CloseButton } from "react-bootstrap";
import { Close } from "@material-ui/icons";

import "./QuickstartGuide.css";

interface QuickstartGuideProps {
  show: boolean;
  handleClose: () => void;
}

const QuickstartGuide = ({
  show,
  handleClose,
}: QuickstartGuideProps): JSX.Element => {
  return (
    <>
      <Dialog
        open={show}
        fullWidth={true}
        maxWidth="sm"
        onClose={() => handleClose()}
        scroll="paper"
      >
        <DialogTitle>
          BitScreen Quickstart
          <IconButton style={{ float: "right" }} onClick={handleClose}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent style={{ display: "flex", flexDirection: "column" }}>
          <h3>Welcome to BitScreen Cloud App</h3>
          <Typography gutterBottom>
            BitScreen is a distributed filtering system for Filecoin storage
            providers using Lotus Miner. It enables users to prevent storage and
            retrieval deals related to known CIDs on private or shared filter
            lists.
            <ul style={{ marginTop: 15 }}>
              <li>
                <div
                  onClick={() =>
                    window.open(
                      "https://github.com/Murmuration-Labs/bitscreen/",
                      "_blank"
                    )
                  }
                  className="quick-link"
                >
                  Read the full BitScreen help documentation.
                </div>
              </li>
            </ul>
          </Typography>

          <h3>Installation</h3>
          <Typography gutterBottom>
            To set up BitScreen, run the configuration script located
            <Link> here</Link>. The script will walk you through available
            options, and will download the required components based on your
            selections. Lotus Miner must be restarted once the BitScreen Plugin
            is installed.
          </Typography>

          <h3>Components</h3>
          <Typography gutterBottom>
            BitScreen has the following components, which operators can use in
            the combination they prefer:
          </Typography>
          <ol>
            <li>
              <span
                onClick={() =>
                  window.open(
                    "https://github.com/Murmuration-Labs/bitscreen",
                    "_blank"
                  )
                }
                className="quick-link"
              >
                Lotus Plugin
              </span>{" "}
              (<i>required</i>): Prevents deals in Lotus for CIDs contained in
              Local CID List or List Manager.
            </li>
            <li>
              Local CID List: Flat file containing CIDs to be filtered. Can be
              edited manually. Acts as fallback if Updater not in use.
            </li>
            <li>
              <span
                onClick={() =>
                  window.open(
                    "https://pypi.org/project/bitscreen-updater/",
                    "_blank"
                  )
                }
                className="quick-link"
              >
                List Updater
              </span>
              : Daemon that periodically checks List Manager for presence of
              CIDs requested by Lotus Plugin. If installed, overrides Local CID
              List.
            </li>
            <li>
              <span>List Manager</span> (<i>optional</i>): Advanced cloud-based
              utility to create, share & import filter lists.
              <ul>
                <li>
                  <span>GUI Client</span>
                </li>
                <li>
                  <span>CLI</span>
                </li>
              </ul>
            </li>
          </ol>

          <h3>Modes</h3>
          <Typography gutterBottom>
            To use BitScreen, run the configuration script and install the
            required components.
          </Typography>
          <ul>
            <li>
              <b>Basic</b>: If you’re using the Plugin with the Local CID list
              only, you can simply edit the CIDs contained on the list manually.
              You won’t be able to share or import lists from other users.
            </li>
            <li>
              <b>Advanced</b>: If you’re using the Plugin with the List Updater
              daemon, you will also need to run the List Manager, either from
              the command line, or using the GUI client.
            </li>
          </ul>

          <h3>To use the List Manager:</h3>
          <ol>
            <li>
              If you’re using the GUI client, connect a Metamask wallet in your
              browser. If you’re using the CLI, export a private key or seed
              phrase from Metamask and enter it when prompted (<i>required</i>).
            </li>
            <li>
              Export a private key or seed phrase from Metamask and enter it
              into the Updater (<i>required</i>).
            </li>
            <li>
              {" "}
              Activate BitScreen filtering via Settings in the GUI client or CLI
              (<i>required</i>).
            </li>
            <li>
              {" "}
              You can now use BitScreen Cloud for advanced management of private
              filter lists.
            </li>
            <li>
              {" "}
              Activate list importing by entering country data in Settings (
              <i>optional</i>).
            </li>
            <li>
              {" "}
              Activate list sharing by entering requested provider information (
              <i>optional</i>).
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickstartGuide;

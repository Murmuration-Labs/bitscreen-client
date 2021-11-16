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
            <ul>
              <li>
                <Link>Read the full BitScreen help documentation.</Link>
              </li>
            </ul>
          </Typography>

          <h3>Installation</h3>
          <Typography gutterBottom>
            To set up BitScreen, run the configuration script located
            <Link> here </Link>. The script will walk you through available
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
              <Link>Lotus Plugin</Link> (required): Prevents deals in Lotus for
              CIDs contained in Local CID List or List Manager.
            </li>
            <li>
              <Link>Local CID List</Link>: Flat file containing CIDs to be
              filtered. Can be edited manually. Acts as fallback if Updater not
              in use.
            </li>
            <li>
              <Link>List Updater</Link>: Daemon that periodically checks List
              Manager for presence of CIDs requested by Lotus Plugin. If
              installed, overrides Local CID List.
            </li>
            <li>
              <Link>List Manager</Link> (optional): Advanced cloud-based utility
              to create, share & import filter lists.
              <ul>
                <li>
                  <Link>GUI Client</Link>
                </li>
                <li>
                  <Link>CLI</Link>
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
              Basic: If you’re using the Plugin with the Local CID list only,
              you can simply edit the CIDs contained on the list manually. You
              won’t be able to share or import lists from other users.
            </li>
            <li>
              Advanced: If you’re using the Plugin with the List Updater daemon,
              you will also need to run the List Manager, either from the
              command line, or using the GUI client.
            </li>
          </ul>

          <h3>To use the List Manager:</h3>
          <ol>
            <li>
              If you’re using the GUI client, connect a Metamask wallet in your
              browser. If you’re using the CLI, export a private key or seed
              phrase from Metamask and enter it when prompted (required).
            </li>
            <li>
              Export a private key or seed phrase from Metamask and enter it
              into the Updater (required).
            </li>
            <li>
              {" "}
              Activate BitScreen filtering via Settings in the GUI client or CLI
              (required).
            </li>
            <li>
              {" "}
              You can now use BitScreen Cloud for advanced management of private
              filter lists.
            </li>
            <li>
              {" "}
              Activate list importing by entering country data in Settings
              (optional).
            </li>
            <li>
              {" "}
              Activate list sharing by entering requested provider information
              (optional).
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickstartGuide;

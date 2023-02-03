import DeleteAccountModal from '../DeleteAccountModal/DeleteAccountModal';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Icon,
  IconButton,
  Link,
  List,
  ListItem,
  makeStyles,
  Typography,
} from '@material-ui/core';
import React from 'react';
import { CloseButton } from 'react-bootstrap';
import { Close } from '@material-ui/icons';

import './QuickstartGuide.css';
import { AccountType } from 'types/interfaces';

interface QuickstartGuideProps {
  show: boolean;
  accountType: AccountType;
  handleClose: () => void;
}

const useStyles = makeStyles(() => ({
  root: {
    fontWeight: 500,
    fontSize: '16px',
    fontFamily: 'Inter',
  },
  title: {
    padding: '0',
  },
}));

const QuickstartGuide = ({
  show,
  handleClose,
  accountType,
}: QuickstartGuideProps): JSX.Element => {
  const classes = useStyles();

  return (
    <>
      <Dialog
        classes={{ root: classes.root }}
        open={show}
        fullWidth={true}
        maxWidth="sm"
        onClose={() => handleClose()}
        scroll="paper"
      >
        <DialogTitle classes={{ root: classes.title }}>
          <div className="title-container">
            <div>BitScreen Quickstart</div>
            <IconButton style={{ float: 'right' }} onClick={handleClose}>
              <Close />
            </IconButton>
          </div>
        </DialogTitle>
        <DialogContent style={{ display: 'flex', flexDirection: 'column' }}>
          <h3>Welcome to BitScreen Cloud App</h3>
          {accountType === AccountType.NodeOperator ? (
            <>
              <div>
                BitScreen is a distributed filtering system for Filecoin storage
                providers using Lotus Miner. It enables users to prevent storage
                and retrieval deals related to known CIDs on private or shared
                filter lists.
                <ul style={{ marginTop: 15 }}>
                  <li>
                    <div
                      onClick={() =>
                        window.open(
                          'https://github.com/Murmuration-Labs/bitscreen/',
                          '_blank'
                        )
                      }
                      className="quick-link"
                    >
                      Read the full BitScreen help documentation.
                    </div>
                  </li>
                </ul>
              </div>

              <h3>Installation</h3>
              <div className="mb-3">
                To set up BitScreen, run the configuration script located
                <Link> here</Link>. The script will walk you through available
                options, and will download the required components based on your
                selections. Lotus Miner must be restarted once the BitScreen
                Plugin is installed.
              </div>

              <h3>Components</h3>
              <div>
                BitScreen has the following components, which operators can use
                in the combination they prefer:
              </div>
              <ol>
                <li>
                  <span
                    onClick={() =>
                      window.open(
                        'https://github.com/Murmuration-Labs/bitscreen',
                        '_blank'
                      )
                    }
                    className="quick-link"
                  >
                    Lotus Plugin
                  </span>{' '}
                  (<i>required</i>): Prevents deals in Lotus for CIDs contained
                  in Local CID List or List Manager.
                </li>
                <li>
                  Local CID List: Flat file containing CIDs to be filtered. Can
                  be edited manually. Acts as fallback if Updater not in use.
                </li>
                <li>
                  <span
                    onClick={() =>
                      window.open(
                        'https://pypi.org/project/bitscreen-updater/',
                        '_blank'
                      )
                    }
                    className="quick-link"
                  >
                    List Updater
                  </span>
                  : Daemon that periodically checks List Manager for presence of
                  CIDs requested by Lotus Plugin. If installed, overrides Local
                  CID List.
                </li>
                <li>
                  <span>List Manager</span> (<i>optional</i>): Advanced
                  cloud-based utility to create, share & import filter lists.
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
              <div className="mb-3">
                To use BitScreen, run the configuration script and install the
                required components.
              </div>
              <ul>
                <li>
                  <b>Basic</b>: If you’re using the Plugin with the Local CID
                  list only, you can simply edit the CIDs contained on the list
                  manually. You won’t be able to share or import lists from
                  other users.
                </li>
                <li>
                  <b>Advanced</b>: If you’re using the Plugin with the List
                  Updater daemon, you will also need to run the List Manager,
                  either from the command line, or using the GUI client.
                </li>
              </ul>

              <h3>To use the List Manager:</h3>
              <ol>
                <li>
                  If you’re using the GUI client, connect a Metamask wallet in
                  your browser. If you’re using the CLI, export a private key or
                  seed phrase from Metamask and enter it when prompted (
                  <i>required</i>).
                </li>
                <li>
                  Export a private key or seed phrase from Metamask and enter it
                  into the Updater (<i>required</i>).
                </li>
                <li>
                  {' '}
                  Activate BitScreen filtering via Settings in the GUI client or
                  CLI (<i>required</i>).
                </li>
                <li>
                  {' '}
                  You can now use BitScreen Cloud for advanced management of
                  private filter lists.
                </li>
                <li>
                  {' '}
                  Activate list importing by entering country data in Settings (
                  <i>optional</i>).
                </li>
                <li>
                  {' '}
                  Activate list sharing by entering requested provider
                  information (<i>optional</i>).
                </li>
              </ol>
            </>
          ) : (
            <>
              <div className="font-italic mb-2">
                Instructions for assessors:
              </div>
              <div className="mb-3">
                As an assessor, you will use BitScreen as a filter list
                management tool, where lists consist of reported CIDs that you
                will review for facial validity and compliance with any relevant
                content policies.
              </div>
              <div>
                We also recommend using our complaint assessment queue, called
                Rodeo, to review inbound complaints received on the network. It
                automatically integrates with the BitScreen list manager, and
                with our transparency hub, Looking glass.
                <ul style={{ marginTop: 15 }}>
                  <li>
                    <div
                      onClick={() =>
                        window.open(
                          'https://github.com/Murmuration-Labs/bitscreen/blob/master/bitscreen_assessor_guide.md',
                          '_blank'
                        )
                      }
                      className="quick-link"
                    >
                      Read the BitScreen assessor guide here for more
                      information
                    </div>
                  </li>
                </ul>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickstartGuide;

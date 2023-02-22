import {
  Dialog,
  DialogContent,
  DialogTitle,
  makeStyles,
  Typography,
} from '@material-ui/core';
import { useState } from 'react';

import { toast } from 'react-toastify';
import { AccountType } from 'types/interfaces';
import './SelectAccountType.css';

interface SelectAccountTypeProps {
  show: boolean;
  handleClose: (accountType: AccountType) => void;
  logout: () => void;
}

const useStyles = makeStyles(() => ({
  root: { padding: '12px' },
}));

const SelectAccountType = ({
  show,
  handleClose,
  logout,
}: SelectAccountTypeProps): JSX.Element => {
  const [selectedAccount, setSelectedAccount] = useState<
    AccountType | undefined
  >();
  const classes = useStyles();

  const mustSelectAccountType = () => {
    return toast.info('You must select an account type to continue');
  };

  return (
    <>
      <Dialog
        open={show}
        fullWidth={true}
        maxWidth="sm"
        classes={{ root: classes.root }}
        onClose={() => {
          if (!selectedAccount) return mustSelectAccountType();
          return toast.info('You must use the start button to continue');
        }}
        scroll="paper"
      >
        <DialogTitle>
          <span style={{ fontWeight: 500, fontSize: '20px' }}>
            Select your account type
          </span>
        </DialogTitle>
        <DialogContent
          style={{
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'inset 0px -1px 0px #CED4DA',
            padding: '0',
          }}
        >
          <div className="account-type-container">
            <div
              onClick={() => setSelectedAccount(AccountType.NodeOperator)}
              className={`account-type-box ${
                selectedAccount === AccountType.NodeOperator
                  ? 'selected-account-type'
                  : ''
              } mb-3 c-pointer no-text-select`}
            >
              <h3>Node operator</h3>
              <Typography gutterBottom>
                Node operators run Filecoin Lotus so that they can act as
                storage providers for the Filecoin network. Use this setting if
                you intend to install the BitScreen Lotus plugin on your node.
              </Typography>
            </div>
            <div
              onClick={() => setSelectedAccount(AccountType.Assessor)}
              className={`account-type-box ${
                selectedAccount === AccountType.Assessor
                  ? 'selected-account-type'
                  : ''
              } c-pointer no-text-select`}
            >
              <h3>Assessor</h3>
              <Typography gutterBottom>
                Assessors evaluate complaints received on the Filecoin network,
                and where appropriate add reported CIDs to filter lists, which
                storage providers may subscribe to in order to filter out these
                items.
              </Typography>
            </div>
          </div>
          <div className="account-type-actions-container">
            <div
              onClick={() => {
                logout();
              }}
              className="account-type-actions mr-2 light-grey-background c-pointer no-text-select"
            >
              Cancel
            </div>
            <div
              onClick={() => {
                if (!selectedAccount) return mustSelectAccountType();
                handleClose(selectedAccount);
              }}
              className="account-type-actions primary-background c-pointer no-text-select"
            >
              Start
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SelectAccountType;

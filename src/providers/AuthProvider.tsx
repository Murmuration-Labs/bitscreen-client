import detectEthereumProvider from '@metamask/detect-provider';
import React, { useEffect } from 'react';
import Web3 from 'web3';
import * as AuthService from 'services/AuthService';
import { toast } from 'react-toastify';
import LoggerService from 'services/LoggerService';
import { Account } from 'types/interfaces';
import { Config } from 'pages/Filters/Interfaces';

interface AuthProviderProps {
  appLogout: () => void;
  children: JSX.Element[];
}

const AuthProvider = (props: AuthProviderProps) => {
  const { appLogout } = props;
  useEffect(() => {
    detectEthereumProvider({
      mustBeMetaMask: true,
    })
      .then(async (walletProvider: any) => {
        if (!walletProvider) {
          return toast.error(
            'In order to use the BitScreen application you need to install the metamask extension on your browser.'
          );
        }
        walletProvider.on('chainChanged', () => {
          LoggerService.debug('Chain change detected.');
          appLogout();
        });

        walletProvider.on('accountsChanged', (wallets: Array<string>) => {
          console.log(wallets[0]);
          LoggerService.debug('Account change detected.');
          const userWallet = AuthService.getAccount()?.walletAddress;
          if (!wallets.length || (userWallet && userWallet !== wallets[0])) {
            appLogout();
          }
        });

        const web3 = new Web3(walletProvider);
        const chainId = await web3.eth.getChainId();

        if (1 !== chainId) {
          LoggerService.debug('Chain ID: ' + chainId);
          appLogout();
        }
      })
      .catch((error) => {
        LoggerService.error(error);
        return toast.error(
          'In order to use the BitScreen application you need to install the metamask extension on your browser.'
        );
      });
  }, []);
  return <>{props.children}</>;
};

export default AuthProvider;

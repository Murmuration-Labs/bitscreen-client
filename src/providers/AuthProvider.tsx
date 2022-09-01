import detectEthereumProvider from '@metamask/detect-provider';
import React, { useEffect } from 'react';
import Web3 from 'web3';
import * as AuthService from 'services/AuthService';
import { toast } from 'react-toastify';
import LoggerService from 'services/LoggerService';

const AuthProvider = (props: any) => {
  const { setProvider, setConfig, currentWallet } = props;
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
          AuthService.removeAccount();
          setProvider(null);
          setConfig(null);
          window.location.reload();
        });

        walletProvider.on('accountsChanged', (wallets: Array<string>) => {
          LoggerService.debug('Account change detected.');
          if (
            !wallets.length ||
            (currentWallet && currentWallet !== wallets[0])
          ) {
            AuthService.removeAccount();
            setProvider(null);
            setConfig(null);
          }
        });

        // dispatch(setProviderAvailable(true));
        const web3 = new Web3(walletProvider);
        const chainId = await web3.eth.getChainId();

        if (1 !== chainId) {
          AuthService.removeAccount();
          setProvider(null);
          setConfig(null);
          LoggerService.debug('Chain ID: ' + chainId);
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

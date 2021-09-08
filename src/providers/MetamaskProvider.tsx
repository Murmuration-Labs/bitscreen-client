import detectEthereumProvider from "@metamask/detect-provider";
import React, { useEffect } from "react";
import Web3 from "web3";
import * as AuthService from "../services/AuthService";

const MetamaskProvider = (props: any) => {
  useEffect(() => {
    detectEthereumProvider({
      mustBeMetaMask: true,
    })
      .then(async (provider: any) => {
        if (!provider) {
          return console.error(
            "Couldn't detect window.ethereum. Web3 functionality will not be available."
          );
        }
        provider.on("chainChanged", () => {
          window.location.reload();
        });

        provider.on("accountsChanged", (wallets: Array<string>) => {
          console.log("Account changes");
          AuthService.updateAccount({
            ...AuthService.getAccount(),
            walletAddress: wallets[0],
          });
        });

        provider.on("disconnect", () => AuthService.removeAccount());

        // dispatch(setProviderAvailable(true));
        const web3 = new Web3(provider);
        const chainId = await web3.eth.getChainId();

        if (1 === chainId) {
          const wallets = await web3.eth.getAccounts();
          AuthService.updateAccount({
            ...AuthService.getAccount(),
            walletAddress: wallets[0],
          });
          return;
        } else {
          AuthService.removeAccount();
        }
      })
      .catch((error) => {
        console.error("Cannot detect provider", error);
      });
  }, []);
  return <>{props.children}</>;
};

export default MetamaskProvider;

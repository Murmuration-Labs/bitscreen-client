import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import "react-bootstrap-typeahead/css/Typeahead.css";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  RouteComponentProps,
} from "react-router-dom";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navigation from "../components/Navigation/Navigation";
import AuthProvider from "../providers/AuthProvider";
import * as AuthService from "../services/AuthService";
import "./App.css";
import Dashboard from "./Dashboard/Dashboard";
import FilterPage from "./Filters/FilterPage";
import Filters from "./Filters/Filters";
import PublicFilterDetailsPage from "./Public/PublicFilterDetails/PublicFilterDetails";
import PublicFilters from "./Public/PublicFilters";
import Settings from "./Settings/Settings";
import detectEthereumProvider from "@metamask/detect-provider";
import Web3 from "web3";
import ApiService from "../services/ApiService";
import { Config } from "./Filters/Interfaces";
import { Account } from "../types/interfaces";

interface MatchParams {
  id: string;
}

export type RouterProps = RouteComponentProps<MatchParams>;

const PrivateRoute = ({
  comp: Component, // use comp prop
  provider: provider,
  config: config,
  ...rest
}) => {
  return (
    <Route
      {...rest}
      render={(props) => {
        if (!provider || !provider.accessToken) {
          return <Redirect to="/settings" />;
        } else {
          return <Component {...props} provider={provider} config={config} />;
        }
      }}
    />
  );
};

function App(): JSX.Element {
  const [wallet, setWallet] = useState<string | undefined>(
    AuthService.getAccount()?.walletAddress
  );
  const [config, setConfig] = useState<Config | null>();
  const [provider, setProvider] = useState<Account | null>(
    AuthService.getAccount()
  );

  const connectMetamask = async () => {
    const walletProvider: any = await detectEthereumProvider({
      mustBeMetaMask: true,
    });

    if (!walletProvider) {
      return toast.error(
        "In order to use the BitScreen client you need to install the metamask extension on your browser. You can get it from here: https://metamask.io"
      );
    }

    const web3 = new Web3(walletProvider);

    const chainId = await web3.eth.getChainId();
    if (chainId !== 1) {
      return toast.error(
        `Please switch to Mainnet in order to use the Bitscreen client.`
      );
    }

    let wallets;
    try {
      wallets = await web3.eth.requestAccounts();
    } catch (e) {
      return toast.error(
        "You must connect with metamask in order to use the Bitscreen client."
      );
    }

    const wallet = wallets[0].toLowerCase();

    let provider;
    let account: Account;
    let signature;

    try {
      provider = await ApiService.getProvider(wallet);
    } catch (e) {
      AuthService.removeAccount();
      return toast.error(
        "Could not get provider information from the server. Please try again later!"
      );
    }

    if (!provider) {
      try {
        provider = await ApiService.createProvider(wallet);
      } catch (e) {
        AuthService.removeAccount();
        return toast.error(
          "Could not create an account at the moment. Please try again later!"
        );
      }
    }

    try {
      signature = await web3.eth.personal.sign(
        provider.nonce,
        provider.walletAddress,
        ""
      );
    } catch (e) {
      AuthService.removeAccount();
      return toast.error(
        "You must sign the metamask request in order to prove that the wallet belongs to you!"
      );
    }

    try {
      account = await ApiService.authenticateProvider(wallet, signature);
    } catch (e) {
      AuthService.removeAccount();
      return toast.error(
        "Could not authenticate you at the moment. Please try again later!"
      );
    }

    let config;
    try {
      config = await ApiService.getProviderConfig(account.id);
    } catch (e: any) {
      if (e.response.status === 404) {
        config = await ApiService.setProviderConfig({
          bitscreen: true,
          import: false,
          share: false,
        });
      }
    }

    const currentAccount = AuthService.getAccount();
    if (currentAccount?.walletAddress !== wallet) {
      AuthService.removeAccount();
      AuthService.createAccount(account);
    }

    setConfig(config);
    setProvider(account);
    setWallet(account.walletAddress);
  };

  useEffect(() => {
    const account = AuthService.getAccount();
    // use only if WE WANT TO REMOVE account on lock & refresh / on disconnect when not on the website and entering the website
    const checkWallet = async (config, walletAddress) => {
      const walletProvider: any = await detectEthereumProvider({
        mustBeMetaMask: true,
      });

      const web3 = new Web3(walletProvider);

      const wallets = await web3.eth.getAccounts();
      if (wallets[0] && wallets[0].toLowerCase() === walletAddress) {
        setConfig(config);
      } else {
        setProvider(null);
        setConfig(null);
        AuthService.removeAccount();
      }
    };
    if (account) {
      ApiService.getProviderConfig(account.id).then((config) => {
        checkWallet(config, account.walletAddress);
      });
    }

    // use below if WE DON'T WANT TO REMOVE account on lock & refresh / on disconnect when not on the website and entering the website
    // if (account) {
    //   ApiService.getProviderConfig(account.id).then((config) => {
    //     setConfig(config);
    //   });
    // }
  }, []);

  return (
    <Router>
      <AuthProvider
        setProvider={setProvider}
        setConfig={setConfig}
        currentWallet={wallet}
      >
        <Navigation
          provider={provider}
          setProvider={setProvider}
          setConfig={setConfig}
        />
        <Container fluid={true}>
          <Row className="fill-height">
            <Col className={"stage"}>
              <Route path="*" exact={true}>
                <Redirect to="/settings" />
              </Route>
              <Route exact path="/">
                <Redirect to="/settings" />
              </Route>
              <Route
                path="/settings"
                exact
                render={(props) => {
                  return (
                    <Settings
                      connectMetamask={connectMetamask}
                      setConfig={setConfig}
                      config={config}
                      setAccount={setProvider}
                      account={provider}
                      {...props}
                    />
                  );
                }}
              />
              <PrivateRoute
                path="/dashboard"
                exact
                comp={Dashboard}
                provider={provider}
                config={config}
              />
              <PrivateRoute
                path="/filters"
                exact
                comp={Filters}
                provider={provider}
                config={config}
              />
              <PrivateRoute
                path="/filters/edit/:shareId?"
                exact
                comp={FilterPage}
                provider={provider}
                config={config}
              />
              <PrivateRoute
                path="/filters/new"
                exact
                comp={FilterPage}
                provider={provider}
                config={config}
              />
              <PrivateRoute
                path="/directory"
                exact
                comp={PublicFilters}
                provider={provider}
                config={config}
              />
              <PrivateRoute
                path="/directory/details/:shareId?"
                exact
                comp={PublicFilterDetailsPage}
                provider={provider}
                config={config}
              />
            </Col>
          </Row>
          <ToastContainer />
        </Container>
      </AuthProvider>
    </Router>
  );
}

export default App;

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
import { Account } from "./Contact/Interfaces";

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
      render={() => {
        if (!provider || !provider.accessToken) {
          return <Redirect to="/settings" />;
        } else {
          return <Component provider={provider} config={config} />;
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

    const currentAccount = AuthService.getAccount();
    if (currentAccount?.walletAddress !== wallet) {
      AuthService.removeAccount();
      AuthService.createAccount({ walletAddress: wallet });
    }

    let provider;
    let account: Account;
    let signature;

    try {
      provider = await ApiService.getProvider(wallet);
    } catch (e) {
      return toast.error(
        "Could not get provider information from the server. Please try again later!"
      );
    }

    if (!provider) {
      try {
        provider = await ApiService.createProvider(wallet);
      } catch (e) {
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
      return toast.error(
        "You must sign the metamask request in order to prove that the wallet belongs to you!"
      );
    }

    try {
      account = await ApiService.authenticateProvider(wallet, signature);
    } catch (e) {
      return toast.error(
        "Could not authenticate you at the moment. Please try again later!"
      );
    }
    AuthService.updateAccount(account);
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
    setConfig(config);
    setProvider(account);
    setWallet(account.walletAddress);
  };

  useEffect(() => {
    const account = AuthService.getAccount();
    if (account) {
      ApiService.getProviderConfig(account.id).then((config) =>
        setConfig(config)
      );
    }
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

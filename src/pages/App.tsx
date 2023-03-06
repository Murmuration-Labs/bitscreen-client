import detectEthereumProvider from '@metamask/detect-provider';
import * as jwt from 'jsonwebtoken';
import React, { useEffect, useState } from 'react';
import { Col, Container, Row } from 'react-bootstrap';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import {
  Redirect,
  Route,
  RouteComponentProps,
  Switch,
  useHistory,
} from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Web3 from 'web3';
import ConsentModal from 'components/Modals/ConsentModal/ConsentModal';
import Navigation from 'components/Navigation/Navigation';
import AuthProvider from 'providers/AuthProvider';
import ApiService from 'services/ApiService';
import * as AuthService from 'services/AuthService';
import LoggerService from 'services/LoggerService';
import {
  Account,
  BasicAuthInfoEmail,
  BasicAuthInfoWallet,
  LoginType,
} from 'types/interfaces';
import './App.css';
import Dashboard from './Dashboard/Dashboard';
import FilterPage from './Filters/FilterPage/FilterPage';
import Filters from './Filters/Filters';
import { Config } from './Filters/Interfaces';
import Login from './Login/Login';
import PublicFilterDetailsPage from './PublicFilters/PublicFilterDetails/PublicFilterDetails';
import PublicFilters from './PublicFilters/PublicFilters';
import Settings from './Settings/Settings';
import { gapi } from 'gapi-script';
import 'resources/styles/helper.css';
import { useGoogleLogout } from 'react-google-login';
import { bitscreenGoogleClientId } from 'config';

interface MatchParams {
  id: string;
}

export type RouterProps = RouteComponentProps<MatchParams>;

const PrivateRoute = ({
  additionalProps,
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
          return <Redirect to="/login" />;
        } else {
          return (
            <Component
              {...props}
              {...additionalProps}
              provider={provider}
              config={config}
            />
          );
        }
      }}
    />
  );
};

function App(): JSX.Element {
  const [config, setConfig] = useState<Config | null>();
  const [provider, setProvider] = useState<Account | null>(
    AuthService.getAccount()
  );
  const [previousPath, setPreviousPath] = useState<string>('');
  const [showConsent, setShowConsent] = useState<boolean>(false);
  const [authSettings, setAuthSettings] = useState<{
    consent: boolean;
    loginType: LoginType | null;
    emailTokenId: string;
  }>({
    consent: false,
    loginType: null,
    emailTokenId: '',
  });

  const history = useHistory();

  const appLogout = () => {
    setProvider(null);
    setConfig(null);
    AuthService.removeAccount();
    toast.success('You have been logged out successfully!');
  };

  const onGoogleLogoutSuccess = () => {
    appLogout();
  };

  const onGoogleLogoutFailure = () => {
    return toast.error(
      'Could not deauthenticate you at the moment using the Google authentication system. Please try again later!'
    );
  };

  const { signOut: googleLogout } = useGoogleLogout({
    clientId: bitscreenGoogleClientId,
    onFailure: onGoogleLogoutFailure,
    onLogoutSuccess: onGoogleLogoutSuccess,
  });

  const authenticateProviderByEmail = async (tokenId?: string) => {
    let account: Account;
    try {
      account = await ApiService.authenticateProviderByEmail(
        tokenId || authSettings.emailTokenId
      );
    } catch (e) {
      LoggerService.error(e);
      AuthService.removeAccount();
      return toast.error(
        'Could not authenticate you at the moment. Please try again later!'
      );
    }

    const currentAccount = AuthService.getAccount();

    if (currentAccount?.loginEmail !== account.loginEmail) {
      AuthService.removeAccount();
      AuthService.createAccount(account, LoginType.Email);
    }

    let configObject;
    try {
      configObject = await ApiService.getProviderConfig();
    } catch (e: any) {
      if (e && e.status === 404) {
        try {
          configObject = await ApiService.setProviderConfig({
            bitscreen: false,
            import: false,
            share: false,
          });
        } catch (e: any) {
          LoggerService.error(e);
        }
      }
    }
    setConfig(configObject);
    setProvider(account);
    setAuthSettings({
      consent: false,
      loginType: null,
      emailTokenId: '',
    });

    if (previousPath) {
      history.push(previousPath);
      setPreviousPath('');
    }

    toast.success('Successfully logged in!');
  };

  const loginWithGoogle = async (tokenId: string) => {
    let provider: BasicAuthInfoEmail | null;
    try {
      provider = (await ApiService.getAuthInfo(
        LoginType.Email,
        tokenId
      )) as BasicAuthInfoEmail | null;
    } catch (e) {
      LoggerService.error(e);
      AuthService.removeAccount();
      return toast.error(
        'Could not get provider information from the server. Please try again later!'
      );
    }

    if (!provider?.consentDate) {
      setAuthSettings({
        consent: false,
        loginType: LoginType.Email,
        emailTokenId: tokenId,
      });
      setShowConsent(true);
      return;
    }

    await authenticateProviderByEmail(tokenId);
  };

  const createProviderByEmail = async () => {
    try {
      await ApiService.createProviderByEmail(authSettings.emailTokenId);

      await authenticateProviderByEmail();
    } catch (e) {
      LoggerService.error(e);
      AuthService.removeAccount();
      return toast.error(
        'Could not create an account at the moment. Please try again later!'
      );
    }
  };

  const connectMetamask = async () => {
    const walletProvider: any = await detectEthereumProvider({
      mustBeMetaMask: true,
    });

    if (!walletProvider) {
      return toast.error(
        'In order to use the BitScreen client you need to install the metamask extension on your browser. You can get it from here: https://metamask.io'
      );
    }

    const web3 = new Web3(walletProvider);

    const chainId = await web3.eth.getChainId();
    if (chainId !== 1) {
      try {
        await walletProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }],
        });
        return;
      } catch (e: any) {
        return toast.error(
          `Please switch to Mainnet in order to use the Bitscreen client.`
        );
      }
    }

    let wallets;
    try {
      wallets = await web3.eth.requestAccounts();
    } catch (e) {
      LoggerService.error(e);
      return toast.error(
        'You must connect with metamask in order to use the Bitscreen client.'
      );
    }

    const wallet = wallets[0].toLowerCase();

    let basicAuthInfo: BasicAuthInfoWallet | null;
    let provider: Account;
    let account: Account;
    let signature;

    try {
      basicAuthInfo = (await ApiService.getAuthInfo(
        LoginType.Wallet,
        wallet
      )) as BasicAuthInfoWallet | null;
    } catch (e) {
      LoggerService.error(e);
      AuthService.removeAccount();
      return toast.error(
        'Could not get provider information from the server. Please try again later!'
      );
    }
    if (!basicAuthInfo) {
      if (!authSettings.consent) {
        setAuthSettings({
          consent: false,
          loginType: LoginType.Wallet,
          emailTokenId: '',
        });
        setShowConsent(true);
        return;
      }
      try {
        provider = await ApiService.createProvider(wallet);
        basicAuthInfo = (await ApiService.getAuthInfo(
          LoginType.Wallet,
          wallet
        )) as BasicAuthInfoWallet;
      } catch (e) {
        LoggerService.error(e);
        AuthService.removeAccount();
        return toast.error(
          'Could not create an account at the moment. Please try again later!'
        );
      }
    }

    if (!basicAuthInfo.consentDate && !authSettings.consent) {
      setAuthSettings({
        consent: false,
        loginType: LoginType.Wallet,
        emailTokenId: '',
      });
      setShowConsent(true);
      return;
    }
    try {
      signature = await web3.eth.personal.sign(
        basicAuthInfo.nonceMessage,
        basicAuthInfo.walletAddress,
        ''
      );
      if (AuthService.getAccount()) return;
    } catch (e) {
      LoggerService.error(e);
      AuthService.removeAccount();
      return toast.error(
        'You must sign the metamask request in order to prove that the wallet belongs to you!'
      );
    }

    try {
      account = await ApiService.authenticateProvider(wallet, signature);
    } catch (e) {
      LoggerService.error(e);
      AuthService.removeAccount();
      return toast.error(
        'Could not authenticate you at the moment. Please try again later!'
      );
    }

    const currentAccount = AuthService.getAccount();
    if (currentAccount?.walletAddress !== wallet) {
      AuthService.removeAccount();
      AuthService.createAccount(account, LoginType.Wallet);
    }

    let configObject;
    try {
      configObject = await ApiService.getProviderConfig();
    } catch (e: any) {
      if (e && e.status === 404) {
        try {
          configObject = await ApiService.setProviderConfig({
            bitscreen: false,
            import: false,
            safer: false,
            share: false,
          });
        } catch (e: any) {
          return LoggerService.error(e);
        }
      }
    }

    if (!basicAuthInfo.consentDate) {
      try {
        const auxAccount = { ...account };
        const consentDate = await ApiService.markConsentDate();
        auxAccount.consentDate = consentDate;
      } catch (e) {
        return LoggerService.error(e);
      }
    }
    setConfig(configObject);
    setProvider(account);
    setAuthSettings({
      consent: false,
      loginType: null,
      emailTokenId: '',
    });

    if (previousPath) {
      history.push(previousPath);
      setPreviousPath('');
    }
  };

  useEffect(() => {
    if (authSettings.consent) {
      if (authSettings.loginType === LoginType.Wallet) connectMetamask();
      else createProviderByEmail();
    }
  }, [authSettings.consent]);

  useEffect(() => {
    const checkWallet = async (config, walletAddress) => {
      const walletProvider: any = await detectEthereumProvider({
        mustBeMetaMask: true,
      });

      const web3 = new Web3(walletProvider);

      const wallets = await web3.eth.getAccounts();
      if (wallets[0] && wallets[0].toLowerCase() === walletAddress) {
        setConfig(config);
      } else {
        appLogout();
      }
    };

    const account = AuthService.getAccount();
    // use only if WE WANT TO REMOVE account on lock & refresh / on disconnect when not on the website and entering the website

    if (account) {
      ApiService.getProviderConfig().then(
        (config) => {
          setConfig(config);
          if (AuthService.getLoginType() === LoginType.Wallet) {
            checkWallet(config, account.walletAddress);
          }
        },
        (err: any) => {
          if (err && err.status === 401) {
            toast.error(err.data.message);
          }
          appLogout();
          return;
        }
      );
    }

    const unlisten = history.listen((location) => {
      if (location.pathname === '/login') return;

      const accessToken = AuthService.getAccount()?.accessToken;
      if (accessToken) {
        const decodedToken: jwt.JwtPayload = jwt.decode(
          accessToken
        ) as jwt.JwtPayload;
        if (
          decodedToken &&
          decodedToken.exp &&
          Date.now() / 1000 > decodedToken.exp
        ) {
          setPreviousPath(location.pathname);
          toast.error('Your token has expired. Please login again!');
          return appLogout();
        }
      }
    });
    return () => {
      unlisten();
    };
  }, []);

  return (
    <AuthProvider appLogout={appLogout}>
      <Navigation
        provider={provider}
        appLogout={appLogout}
        googleLogout={googleLogout}
      />
      <Container fluid={true}>
        <Row className="fill-height">
          <Col className={'stage'}>
            <Switch>
              <Route exact path="/">
                <Redirect to="/login" />
              </Route>
              <Route
                path="/login"
                exact
                render={(props) => {
                  if (!AuthService.getAccount() && props.location.state) {
                    const { tokenExpired, currentPath } = props.location
                      .state as {
                      tokenExpired: boolean;
                      currentPath: string;
                    };

                    if (tokenExpired) {
                      return (
                        <Login
                          loginWithGoogle={loginWithGoogle}
                          connectMetamask={connectMetamask}
                          setConfig={setConfig}
                          config={config}
                          setProvider={setProvider}
                          provider={provider}
                          setPreviousPath={setPreviousPath}
                          previousPath={currentPath}
                          {...props}
                        />
                      );
                    }
                  }

                  if (provider && !provider.guideShown) {
                    return <Redirect to="/settings" />;
                  } else if (provider && provider.guideShown) {
                    return <Redirect to="/dashboard" />;
                  } else {
                    return (
                      <Login
                        loginWithGoogle={loginWithGoogle}
                        connectMetamask={connectMetamask}
                        setConfig={setConfig}
                        config={config}
                        setProvider={setProvider}
                        provider={provider}
                        {...props}
                      />
                    );
                  }
                }}
              />
              <PrivateRoute
                path="/settings"
                exact
                comp={Settings}
                provider={provider}
                config={config}
                additionalProps={{
                  setProvider: setProvider,
                  setConfig: setConfig,
                  googleLogout: googleLogout,
                  appLogout: appLogout,
                }}
              />
              <PrivateRoute
                path="/dashboard"
                exact
                comp={Dashboard}
                provider={provider}
                config={config}
                additionalProps={{}}
              />
              <PrivateRoute
                path="/filters"
                exact
                comp={Filters}
                provider={provider}
                additionalProps={{}}
                config={config}
              />
              <PrivateRoute
                path="/filters/edit/:shareId?"
                exact
                comp={FilterPage}
                provider={provider}
                additionalProps={{}}
                config={config}
              />
              <PrivateRoute
                path="/filters/new"
                exact
                comp={FilterPage}
                provider={provider}
                additionalProps={{}}
                config={config}
              />
              <PrivateRoute
                path="/directory"
                exact
                comp={PublicFilters}
                provider={provider}
                additionalProps={{}}
                config={config}
              />
              <PrivateRoute
                path="/directory/details/:shareId?"
                exact
                comp={PublicFilterDetailsPage}
                provider={provider}
                additionalProps={{}}
                config={config}
              />
              <Route exact path="*">
                <Redirect to="/login" />
              </Route>
            </Switch>
          </Col>
        </Row>
        <ConsentModal
          show={showConsent}
          callback={(consent: boolean) =>
            setAuthSettings({ ...authSettings, consent })
          }
          closeCallback={() => setShowConsent(false)}
        />
        <ToastContainer position="bottom-left" />
      </Container>
    </AuthProvider>
  );
}

export default App;

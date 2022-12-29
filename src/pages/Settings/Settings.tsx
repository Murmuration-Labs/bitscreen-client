import { Switch, withStyles } from '@material-ui/core';
import detectEthereumProvider from '@metamask/detect-provider';
import { bitscreenGoogleClientId } from 'config';
import _ from 'lodash';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Typeahead } from 'react-bootstrap-typeahead';
import { useGoogleLogin } from 'react-google-login';
import { Prompt } from 'react-router';
import countryList from 'react-select-country-list';
import { toast } from 'react-toastify';
import { useTitle } from 'react-use';
import { activeIcon, inactiveIcon, infoIcon } from 'resources/icons';
import ApiService from 'services/ApiService';
import * as AuthService from 'services/AuthService';
import LoggerService from 'services/LoggerService';
import { Account, LoginType } from 'types/interfaces';
import validator from 'validator';
import Web3 from 'web3';
import { Config } from '../Filters/Interfaces';
import DeleteAccountModal from './DeleteAccountModal/DeleteAccountModal';
import QuickstartGuide from './QuickstartGuide/QuickstartGuide';
import './Settings.css';

const HtmlSwitchComponent = withStyles((theme) => ({
  root: {
    width: 28,
    height: 16,
    padding: 0,
    display: 'flex',
  },
  switchBase: {
    padding: 2,
    color: '#7A869A',
    '&$checked': {
      transform: 'translateX(12px)',
      color: theme.palette.common.white,
      '& + $track': {
        opacity: 1,
        backgroundColor: '#027BFE',
        borderColor: '#027BFE',
      },
    },
  },
  thumb: {
    width: 12,
    height: 12,
    boxShadow: 'none',
  },
  track: {
    border: `1px solid #7A869A`,
    borderRadius: 16 / 2,
    opacity: 1,
    backgroundColor: theme.palette.common.white,
  },
  checked: {},
}))(Switch);

const providerInitialState = {
  id: 0,
  walletAddressHashed: '',
  businessName: '',
  website: '',
  email: '',
  contactPerson: '',
  address: '',
  nonce: '',
  guideShown: false,
  walletAddress: '',
  loginEmail: '',
};

const configInitialState = {
  bitscreen: false,
  import: false,
  share: false,
};

export default function Settings(props) {
  useTitle('Settings - BitScreen');
  const { config, setProvider, setConfig, appLogout, googleLogout } = props;

  const [providerInfo, setProviderInfo] =
    useState<Account>(providerInitialState);
  const [configInfo, setConfigInfo] = useState<Config>(configInitialState);

  const [isDisabledWhileApiCall, setIsDisabledWhileApiCall] =
    useState<boolean>(false);

  const [showQuickstartGuide, setShowQuickstartGuide] =
    useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const [countryInputValue, setCountryInputValue] = useState<Array<string>>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const countries = countryList();
  const countryNames = countries.data.map((e) => e.label);

  const linkWalletToGoogleAccount = async (tokenId: string) => {
    try {
      const updatedProvider = await ApiService.linkWalletToGoogleAccount(
        tokenId
      );
      updatedProvider.accessToken = AuthService.getAccount()?.accessToken;
      const providerWithWalletAddress = {
        ...updatedProvider,
        walletAddress: providerInfo.walletAddress,
      };
      AuthService.updateAccount(providerWithWalletAddress);
      setProviderInfo(providerWithWalletAddress);
      toast.success(
        'Provider successfully linked to specified Google Account.'
      );
    } catch (e: any) {
      if (e && e.data) {
        return toast.error(e.data.message || e.data.error);
      } else {
        return toast.error(
          'Could not link the account at the moment. Please try again later!'
        );
      }
    }
  };

  const onGoogleLoginFailure = () => {
    return toast.error(
      'Could not authenticate you at the moment using Google authentication system. Please try again later!'
    );
  };

  const onGoogleLoginSuccess = async (res: any) => {
    await linkWalletToGoogleAccount(res.tokenId);
  };

  const { signIn: googleLogin } = useGoogleLogin({
    clientId: bitscreenGoogleClientId,
    onFailure: onGoogleLoginFailure,
    onSuccess: onGoogleLoginSuccess,
  });

  const linkGoogleToWalletAccount = async () => {
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

    let walletAddress: string;
    let nonceMessage: string;

    try {
      ({ walletAddress, nonceMessage } =
        await ApiService.generateNonceForSignature(wallet));
    } catch (e: any) {
      if (e && e.data) {
        return toast.error(e.data.message || e.data.error);
      } else {
        return toast.error(
          'Could not generate nonce for Metamask signature. Please try again later!'
        );
      }
    }

    const signature = await web3.eth.personal.sign(
      nonceMessage,
      walletAddress,
      ''
    );

    try {
      const updatedProvider = await ApiService.linkProviderToWallet(
        wallet,
        signature
      );
      updatedProvider.accessToken = AuthService.getAccount()?.accessToken;
      AuthService.updateAccount(updatedProvider);
      setProviderInfo(updatedProvider);
      return toast.success(
        'Provider account successfully linked to wallet address!'
      );
    } catch (e: any) {
      if (e && e.data) {
        return toast.error(e.data.message || e.data.error);
      } else {
        return toast.error(
          'Could not link the account at the moment. Please try again later!'
        );
      }
    }
  };

  const unlinkFromSecondLoginType = async () => {
    try {
      const updatedProvider = await ApiService.unlinkFromSecondLoginType();
      updatedProvider.accessToken = AuthService.getAccount()?.accessToken;
      if (AuthService.getLoginType() === LoginType.Wallet) {
        updatedProvider.walletAddress = providerInfo.walletAddress;
        updatedProvider.walletAddressHashed = providerInfo.walletAddressHashed;
      }
      AuthService.updateAccount(updatedProvider);
      setProviderInfo(updatedProvider);
      return toast.success(
        `Successfully unlinked account from ${
          AuthService.getLoginType() === LoginType.Email
            ? 'wallet'
            : 'Google email'
        }!`
      );
    } catch (e: any) {
      if (e && e.data) {
        return toast.error(e.data.message || e.data.error);
      } else {
        return toast.error(
          'Could unlink the account at the moment. Please try again later!'
        );
      }
    }
  };

  useEffect(() => {
    LoggerService.info('Loading Settings page.');
  }, []);

  useEffect(() => {
    const { config } = props;

    if (config) {
      setConfigInfo({ ...config });
    }
  }, [props.config]);

  useEffect(() => {
    const { provider } = props;

    if (provider && (provider.walletAddress || provider.loginEmail)) {
      setProviderInfo({
        ...provider,
      });

      if (provider.country) {
        setCountryInputValue([
          countries.data.find((e) => e.value === provider.country)?.label || '',
        ]);
      }

      if (provider.lastUpdate) {
        setLastUpdated(moment(provider.lastUpdate).format('lll'));
      } else {
        setLastUpdated('N/A');
      }

      if (!provider.guideShown) setShowQuickstartGuide(true);
    }
  }, [props.provider]);

  const hasUnsavedChanges = () => {
    const { config, provider } = props;
    if (!_.isEqual(config, configInfo)) {
      return true;
    }

    if (!_.isEqual(provider, providerInfo)) {
      return true;
    }
  };

  const hasUnfilledInfo = () => {
    if ((configInfo.share || configInfo.import) && !providerInfo.country) {
      return true;
    }

    if (
      configInfo.share &&
      (!providerInfo.businessName ||
        !providerInfo.address ||
        !providerInfo.contactPerson ||
        !providerInfo.email ||
        !providerInfo.website)
    ) {
      return true;
    }
  };

  const isSaveValid = () => {
    const { config } = props;

    if (
      config &&
      ((!config.import && configInfo.import) ||
        (!config.share && configInfo.share)) &&
      !providerInfo.country
    ) {
      toast.error(
        'Please select a country from the list in order to enable importing or sharing lists!'
      );
      return false;
    }

    if (
      config &&
      !config.share &&
      configInfo.share &&
      (!providerInfo.businessName ||
        !providerInfo.address ||
        !providerInfo.contactPerson ||
        !providerInfo.email ||
        !providerInfo.website)
    ) {
      toast.error(
        'Please fill the entire form in order to enable sharing lists!'
      );
      return false;
    }

    if (
      configInfo.share &&
      providerInfo.website &&
      !validator.isURL(providerInfo.website)
    ) {
      toast.error('Website is not a valid URL!');
      return false;
    }

    if (
      configInfo.share &&
      providerInfo.email &&
      !validator.isEmail(providerInfo.email)
    ) {
      toast.error('Email is not valid!');
      return false;
    }

    return true;
  };

  const saveProviderInfo = async () => {
    if (!isSaveValid()) {
      return;
    }

    setIsDisabledWhileApiCall(true);
    const provider = {
      ...providerInfo,
    };
    const config = { ...configInfo };

    try {
      const updatedProvider = await ApiService.updateProvider(provider);
      AuthService.updateAccount({
        ...updatedProvider,
        accessToken: AuthService.getAccount()?.accessToken,
      });
    } catch (e: any) {
      if (e && e.status === 401 && props.config) {
        toast.error(e.data.message);
        return;
      }
      toast.error(
        "Couldn't update the provider information. Please try again later!"
      );
      LoggerService.error(e);
      setIsDisabledWhileApiCall(false);
      return;
    }

    try {
      await ApiService.setProviderConfig(config);
    } catch (e: any) {
      if (e && e.status === 401 && props.config) {
        toast.error(e.data.message);
        return;
      }
      toast.error(
        "Couldn't update the provider configuration. Please try again later!"
      );
      LoggerService.error(e);
      setIsDisabledWhileApiCall(false);
      return;
    }

    setConfig(config);
    setProvider(provider);

    toast.success('Successfully updated provider information!');
    setIsDisabledWhileApiCall(false);
  };

  const handleDeleteClose = (result: boolean) => {
    setShowDeleteModal(false);
    LoggerService.info('Hiding Delete account modal.');

    if (result) {
      setProvider(null);
      setConfig(null);
      AuthService.removeAccount();
    }
  };

  const handleQuickstartGuideClose = async () => {
    setShowQuickstartGuide(false);

    const provider = { ...providerInfo };
    if (!provider.guideShown) {
      provider.guideShown = true;

      setIsDisabledWhileApiCall(true);

      try {
        await ApiService.updateProvider(provider);
        AuthService.updateAccount(provider);
        setProviderInfo(provider);
        setProvider(provider);
      } catch (e: any) {
        if (e && e.status === 401 && props.config) {
          toast.error(e.data.message);
          return;
        }
        toast.error(
          "Couldn't update the provider information. Please try again later!"
        );
        LoggerService.error(e);
      } finally {
        setIsDisabledWhileApiCall(false);
      }
    }
  };

  const clearForm = () => {
    setProviderInfo({
      ...providerInitialState,
      country: providerInfo.country,
      lastUpdate: providerInfo.lastUpdate,
    });
  };

  return (
    <div className="settings-page-container">
      <div className="page-title">Settings</div>
      <div className="box-container d-flex justify-content-between">
        <div className="page-left-side">
          <div
            aria-describedby="account-details-section"
            className="section account-details"
          >
            <div className="section-title t-lp">Account details</div>
            <div
              aria-describedby="wallet-status-slice"
              className="section-slice"
            >
              {providerInfo.loginEmail && (
                <>
                  <div className="slice-title-row t-lp">
                    Google account connected
                  </div>
                  <div className="slice-info address-info t-lp">
                    Login email: {providerInfo.loginEmail}
                  </div>
                </>
              )}
              {providerInfo.walletAddress && (
                <>
                  <div className="slice-title-row t-lp">Wallet connected</div>
                  <div className="slice-info address-info t-lp">
                    Address: {providerInfo.walletAddress}
                  </div>
                </>
              )}
            </div>
            <div
              aria-describedby="wallet-status-actions"
              className="wallet-status-actions d-flex justify-content-between align-items-center"
            >
              <div className="d-flex">
                <div className="logout-button mr-3">
                  <Button
                    onClick={() => {
                      AuthService.getLoginType() === LoginType.Wallet
                        ? appLogout()
                        : googleLogout();
                    }}
                    variant="primary"
                    className="button-style blue-button"
                    type="button"
                    disabled={isDisabledWhileApiCall}
                  >
                    Logout
                  </Button>
                </div>
                {(!providerInfo.loginEmail ||
                  !providerInfo.walletAddressHashed) && (
                  <div className="Link account button">
                    <Button
                      onClick={() => {
                        AuthService.getLoginType() === LoginType.Email
                          ? linkGoogleToWalletAccount()
                          : googleLogin();
                      }}
                      variant="primary"
                      className="button-style blue-button"
                      type="button"
                      disabled={isDisabledWhileApiCall}
                    >
                      Link account to{' '}
                      {AuthService.getLoginType() === LoginType.Email
                        ? 'wallet'
                        : 'Google email'}
                    </Button>
                  </div>
                )}
                {((AuthService.getLoginType() === LoginType.Wallet &&
                  providerInfo.loginEmail) ||
                  (AuthService.getLoginType() === LoginType.Email &&
                    providerInfo.walletAddressHashed)) && (
                  <div className="Link account button">
                    <Button
                      onClick={() => {
                        unlinkFromSecondLoginType();
                      }}
                      variant="primary"
                      className="button-style blue-button"
                      type="button"
                      disabled={isDisabledWhileApiCall}
                    >
                      Disconnect{' '}
                      {AuthService.getLoginType() === LoginType.Email
                        ? 'wallet'
                        : 'Google'}{' '}
                      account
                    </Button>
                  </div>
                )}
              </div>
              <div className="export-delete d-flex">
                <div className="export mr-12px">
                  <Button
                    onClick={async () => {
                      try {
                        await ApiService.exportAccount();
                      } catch (e: any) {
                        if (e && e.status === 401 && props.config) {
                          toast.error(e.data.message);
                          return;
                        }
                      }
                    }}
                    variant="primary"
                    className="button-style blue-button"
                    type="button"
                    disabled={isDisabledWhileApiCall}
                  >
                    Export account
                  </Button>
                </div>
                <div className="delete-button">
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    variant="primary"
                    className="button-style red-button"
                    type="button"
                    disabled={isDisabledWhileApiCall}
                  >
                    Delete account
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div aria-describedby="options-section" className="section options">
            <div className="section-title t-lp">Options</div>
            <div
              aria-describedby="enable-bitscreen-slice"
              className="section-slice pb-16px"
            >
              <div className="slice-title-row t-lp d-flex justify-content-between align-items-center">
                <span>Enable all BitScreen lists</span>
                <HtmlSwitchComponent
                  color="primary"
                  checked={configInfo.bitscreen}
                  onChange={() =>
                    setConfigInfo({
                      ...configInfo,
                      bitscreen: !configInfo.bitscreen,
                    })
                  }
                  name="filter-lists"
                />
              </div>
              <div className="slice-description t-ls">
                If you disable all BitScreen lists, no deals will be blocked.
              </div>
            </div>

            {configInfo.bitscreen && (
              <div
                aria-describedby="activate-importing-slice"
                className="section-slice pb-16px"
              >
                <div className="slice-title-row t-lp d-flex justify-content-between align-items-center">
                  <span>Activate Importing lists</span>
                  <HtmlSwitchComponent
                    color="primary"
                    checked={configInfo.import}
                    onChange={() =>
                      setConfigInfo({
                        ...configInfo,
                        import: !configInfo.import,
                      })
                    }
                    name="filter-lists"
                  />
                </div>
                <div className="slice-description t-ls">
                  Use filter lists by third parties to prevent deals in Lotus.
                  (Requires{' '}
                  <span
                    onClick={() =>
                      window.open(
                        'https://github.com/Murmuration-Labs/bitscreen',
                        '_blank'
                      )
                    }
                    className="external-link"
                  >
                    Lotus Plugin
                  </span>{' '}
                  &{' '}
                  <span
                    onClick={() =>
                      window.open(
                        'https://pypi.org/project/bitscreen-updater/',
                        '_blank'
                      )
                    }
                    className="external-link"
                  >
                    Updater
                  </span>
                  )
                </div>
                {(configInfo.import || configInfo.share) && (
                  <div
                    aria-describedby="import-toggled-area"
                    className="d-flex flex-column"
                  >
                    <div className="slice-guide t-ls">
                      Please add country data (required for both importing and
                      sharing).
                    </div>
                    <div className="slice-input">
                      <div className="input-label">Country</div>
                      <div className="input-field">
                        <Typeahead
                          id="country"
                          options={countryNames}
                          placeholder="Country"
                          onChange={(country) => {
                            setCountryInputValue(country);
                            setProviderInfo({
                              ...providerInfo,
                              country:
                                countryList().data.find(
                                  (e) => e.label === country[0]
                                )?.value || '',
                            });
                          }}
                          selected={countryInputValue}
                        ></Typeahead>
                      </div>
                    </div>
                    <div className="slice-input">
                      <div className="input-label">Miner ID</div>
                      <div className="input-field">
                        <Form.Control
                          role="miner-id"
                          placeholder="Miner ID"
                          type="text"
                          value={providerInfo.minerId || ''}
                          onChange={(e) => {
                            setProviderInfo({
                              ...providerInfo,
                              minerId: e.target.value,
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {configInfo.bitscreen && (
              <div
                aria-describedby="activate-sharing-slice"
                className="section-slice pb-16px"
              >
                <div className="slice-title-row t-lp d-flex justify-content-between align-items-center">
                  <span>Activate Sharing Lists</span>
                  <HtmlSwitchComponent
                    color="primary"
                    checked={configInfo.share}
                    onChange={() =>
                      setConfigInfo({
                        ...configInfo,
                        share: !configInfo.share,
                      })
                    }
                    name="filter-lists"
                  />
                </div>
                <div className="slice-description t-ls">
                  Share your filter lists with other Bitscreen users. (Requires{' '}
                  <span
                    onClick={() =>
                      window.open(
                        'https://github.com/Murmuration-Labs/bitscreen',
                        '_blank'
                      )
                    }
                    className="external-link"
                  >
                    Lotus Plugin
                  </span>{' '}
                  &{' '}
                  <span
                    onClick={() =>
                      window.open(
                        'https://pypi.org/project/bitscreen-updater/',
                        '_blank'
                      )
                    }
                    className="external-link"
                  >
                    Updater
                  </span>
                  )
                </div>
                {configInfo.share && (
                  <div
                    aria-describedby="share-toggled-area"
                    className="d-flex flex-column"
                  >
                    <div className="slice-guide t-ls">
                      Please add list provider information (required for sharing
                      and made public in Directory).
                    </div>
                    <div className="slice-input">
                      <div className="input-label">Business Name</div>
                      <div className="input-field">
                        <Form.Control
                          role="business-name"
                          placeholder="Business name"
                          type="text"
                          value={providerInfo.businessName || ''}
                          onChange={(e) => {
                            setProviderInfo({
                              ...providerInfo,
                              businessName: e.target.value,
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="slice-input">
                      <div className="input-label">Website</div>
                      <div className="input-field">
                        <Form.Control
                          role="website"
                          placeholder="Website"
                          type="text"
                          value={providerInfo.website || ''}
                          onChange={(e) => {
                            setProviderInfo({
                              ...providerInfo,
                              website: e.target.value,
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="slice-input">
                      <div className="input-label">Email</div>
                      <div className="input-field">
                        <Form.Control
                          role="email"
                          placeholder="Email"
                          type="text"
                          value={providerInfo.email || ''}
                          onChange={(e) => {
                            setProviderInfo({
                              ...providerInfo,
                              email: e.target.value,
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="slice-input">
                      <div className="input-label">Contact person</div>
                      <div className="input-field">
                        <Form.Control
                          role="contact-person"
                          placeholder="Contact person"
                          type="text"
                          value={providerInfo.contactPerson || ''}
                          onChange={(e) => {
                            setProviderInfo({
                              ...providerInfo,
                              contactPerson: e.target.value,
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="slice-input">
                      <div className="input-label">Address</div>
                      <div className="input-field">
                        <Form.Control
                          role="business-address"
                          placeholder="Business address"
                          type="text"
                          value={providerInfo.address || ''}
                          onChange={(e) => {
                            setProviderInfo({
                              ...providerInfo,
                              address: e.target.value,
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {configInfo.bitscreen && (
              <div
                aria-describedby="download-cids-slice"
                className="section-slice download-cids d-flex justify-content-between"
              >
                <div className="section-left-side">
                  <div className="slice-title-row t-lp">Download CID list</div>
                  <div className="slice-description t-ls">
                    Download CIDs from lists you own to run in Local CID List.
                  </div>
                </div>
                <div className="section-right-side">
                  <div className="download-button">
                    <Button
                      onClick={async () => {
                        try {
                          await ApiService.downloadCidList();
                        } catch (e: any) {
                          if (e && e.status === 401 && props.config) {
                            toast.error(e.data.message);
                            return;
                          }
                        }
                      }}
                      variant="primary"
                      className="button-style blue-button"
                      type="button"
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {(configInfo.bitscreen ||
              (config.bitscreen && !configInfo.bitscreen)) && (
              <div
                aria-describedby="form-actions-slice"
                className="section-slice d-flex"
              >
                {configInfo.share && (
                  <div className="clear-button mr-12px">
                    <Button
                      onClick={() => {
                        clearForm();
                      }}
                      variant="primary"
                      className="button-style grey-button"
                      type="button"
                    >
                      Clear
                    </Button>
                  </div>
                )}
                <div className="save-button">
                  <Button
                    onClick={() => {
                      saveProviderInfo();
                    }}
                    variant="primary"
                    className="button-style blue-button"
                    type="button"
                    disabled={isDisabledWhileApiCall}
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="page-right-side">
          <div className="section status">
            <div className="section-title">Status</div>
            <div aria-describedby="tools-slice" className="section-slice tools">
              <div className="slice-title-row t-lp">Tools</div>
              <div className="slice-info pb-8px t-lp d-flex justify-content-between align-items-center">
                <span>Manage private lists</span>
                <div className="check-icon">
                  {config && config.bitscreen ? (
                    <img width={16} src={activeIcon}></img>
                  ) : (
                    <img width={16} src={inactiveIcon}></img>
                  )}
                </div>
              </div>
              <div className="slice-info pb-8px t-lp d-flex justify-content-between align-items-center">
                <span>Download CID list</span>
                <div className="check-icon">
                  {config && config.bitscreen ? (
                    <img width={16} src={activeIcon}></img>
                  ) : (
                    <img width={16} src={inactiveIcon}></img>
                  )}
                </div>
              </div>
              <div className="slice-info pb-8px t-lp d-flex justify-content-between align-items-center">
                <span>Import lists</span>
                <div className="check-icon">
                  {config && config.bitscreen && config.import ? (
                    <img width={16} src={activeIcon}></img>
                  ) : (
                    <img width={16} src={inactiveIcon}></img>
                  )}
                </div>
              </div>
              <div className="slice-info pb-8px t-lp d-flex justify-content-between align-items-center">
                <span>Share lists</span>
                <div className="check-icon">
                  {config && config.bitscreen && config.share ? (
                    <img width={16} src={activeIcon}></img>
                  ) : (
                    <img width={16} src={inactiveIcon}></img>
                  )}
                </div>
              </div>
            </div>
            <div
              aria-describedby="list-updater-slice"
              className="section-slice list-updater"
            >
              <div className="slice-title-row d-flex align-items-center t-lp">
                <span className="mr-2">List Updater</span>
                <OverlayTrigger
                  placement="right"
                  delay={{ show: 150, hide: 300 }}
                  overlay={
                    <Tooltip id="help-tooltip">
                      Checks list manager for CIDs requested by BitScreen plugin
                    </Tooltip>
                  }
                >
                  <img width={16} src={infoIcon}></img>
                </OverlayTrigger>
              </div>
              <div className="slice-info t-lp d-flex justify-content-between align-items-center">
                <span>Last connected: {lastUpdated}</span>
              </div>
            </div>
          </div>
          <div className="section help">
            <div className="section-title">Help</div>
            <div
              onClick={() => {
                setShowQuickstartGuide(true);
              }}
              className="help-link pb-8px"
            >
              View quickstart guide
            </div>
            {/* <div className="help-link pb-8px">
              Download plugin configuration script
            </div> */}
            <div
              onClick={() =>
                window.open(
                  'https://github.com/Murmuration-Labs/bitscreen/',
                  '_blank'
                )
              }
              className="help-link pb-8px"
            >
              Read full BitScreen help documentation
            </div>
          </div>
        </div>
        {config && config.bitscreen && (
          <Prompt
            when={hasUnsavedChanges() || hasUnfilledInfo()}
            message={(location, action) => {
              if (location.state) {
                const { tokenExpired } = location.state as {
                  tokenExpired: boolean;
                };
                if (tokenExpired) {
                  return true;
                }
              }

              if (
                providerInfo &&
                providerInfo.accessToken &&
                hasUnsavedChanges()
              ) {
                return 'You have unsaved changes, are you sure you want to leave?';
              }

              if (
                providerInfo &&
                providerInfo.accessToken &&
                hasUnfilledInfo()
              ) {
                return 'You have activated a toggle but did not enter relevant data, are you sure you want to leave?';
              }

              return true;
            }}
          />
        )}
      </div>
      <DeleteAccountModal
        show={showDeleteModal}
        handleClose={handleDeleteClose}
      />
      <QuickstartGuide
        show={showQuickstartGuide}
        handleClose={handleQuickstartGuideClose}
      />
    </div>
  );
}

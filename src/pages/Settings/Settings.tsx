import { Switch, withStyles } from '@material-ui/core';
import detectEthereumProvider from '@metamask/detect-provider';
import { useGoogleLogin } from '@react-oauth/google';
import { lookingGlassUri } from 'config';
import _ from 'lodash';
import moment from 'moment';
import { useEffect, useState } from 'react';
import { Button, Form, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Typeahead } from 'react-bootstrap-typeahead';
import { Prompt } from 'react-router';
import countryList from 'react-select-country-list';
import { toast } from 'react-toastify';
import { useTitle } from 'react-use';
import { activeIcon, inactiveIcon, infoIcon } from 'resources/icons';
import ApiService from 'services/ApiService';
import * as AuthService from 'services/AuthService';
import LoggerService from 'services/LoggerService';
import { Account, AccountType, LoginType } from 'types/interfaces';
import validator from 'validator';
import Web3 from 'web3';
import { Config } from '../Filters/Interfaces';
import DeleteAccountModal from './DeleteAccountModal/DeleteAccountModal';
import QuickstartGuide from './QuickstartGuide/QuickstartGuide';
import SelectAccountType from './SelectAccountModal/SelectAccountType';
import './Settings.css';
import { getAddressHash } from 'library/helpers/helpers.functions';

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
  safer: false,
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

  const [showSelectAccount, setShowSelectAccount] = useState<boolean>(false);
  const [showQuickstartGuide, setShowQuickstartGuide] =
    useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const [countryInputValue, setCountryInputValue] = useState<Array<string>>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [displayedWalletAddress, setDisplayedWalletAddress] = useState<{
    canDisplay: boolean;
    walletAddress: string;
  }>({
    canDisplay: false,
    walletAddress: '',
  });
  const countries = countryList();
  const countryNames = countries.data.map((e) => e.label);

  const logout = () => {
    AuthService.getLoginType() === LoginType.Wallet
      ? appLogout()
      : appLogout(true);
  };

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
      setProviderInfo({
        ...providerWithWalletAddress,
        assessorId: providerInfo.assessorId,
        loginEmail: updatedProvider.loginEmail,
      });
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

  const onGoogleLoginSuccess = async (tokenResponse: any) => {
    await linkWalletToGoogleAccount(tokenResponse.access_token);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: onGoogleLoginSuccess,
    onError: onGoogleLoginFailure,
    flow: 'implicit',
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
      setProviderInfo({
        ...updatedProvider,
        assessorId: providerInfo.assessorId,
      });
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
      setProviderInfo({
        ...updatedProvider,
        assessorId: providerInfo.assessorId,
      });
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
    const currentAccount = AuthService.getAccount();
    if (!currentAccount) return logout();

    if (AuthService.getLoginType() === LoginType.Wallet) {
      setDisplayedWalletAddress({
        canDisplay: true,
        walletAddress: currentAccount.walletAddress!,
      });
    } else if (providerInfo.walletAddressHashed) {
      detectEthereumProvider({
        mustBeMetaMask: true,
      }).then((walletProvider: any) => {
        const currentlySelectedAddress = walletProvider.selectedAddress;
        setDisplayedWalletAddress({
          canDisplay:
            getAddressHash(currentlySelectedAddress) ===
            providerInfo.walletAddressHashed,
          walletAddress: currentlySelectedAddress,
        });
      });
    }
  }, []);

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

      if (!provider.accountType) return setShowSelectAccount(true);
      if (!provider.guideShown) return setShowQuickstartGuide(true);
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
    if (
      providerInfo.accountType === AccountType.Assessor &&
      (!providerInfo.contactPerson ||
        !providerInfo.businessName ||
        !providerInfo.website ||
        !providerInfo.email ||
        !providerInfo.address ||
        !providerInfo.country)
    )
      return true;

    if (providerInfo.accountType === AccountType.NodeOperator) {
      if (
        configInfo.import &&
        (!providerInfo.country || !providerInfo.minerId || !providerInfo.email)
      )
        return true;

      if (
        configInfo.share &&
        (!providerInfo.contactPerson ||
          !providerInfo.businessName ||
          !providerInfo.website ||
          !providerInfo.address)
      )
        return true;
    }
  };

  const isSaveValid = () => {
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

    if (
      providerInfo.accountType === AccountType.Assessor &&
      (!providerInfo.contactPerson ||
        !providerInfo.businessName ||
        !providerInfo.website ||
        !providerInfo.email ||
        !providerInfo.address ||
        !providerInfo.country)
    ) {
      toast.error(
        'In order to enlist as an assessor you need to fill out the entire form!'
      );
      return false;
    }

    if (providerInfo.accountType === AccountType.NodeOperator) {
      if (
        configInfo.import &&
        (!providerInfo.country || !providerInfo.minerId || !providerInfo.email)
      ) {
        toast.error(
          'Please fill the following fields in order to use the importing lists functionality: Country, Miner ID, Email!'
        );
        return false;
      }

      if (configInfo.safer && !configInfo.import) {
        toast.error(
          'You must enable importing in order to enable the enhanced filtering!'
        );
        return false;
      }

      if (
        configInfo.share &&
        (!providerInfo.contactPerson ||
          !providerInfo.businessName ||
          !providerInfo.website ||
          !providerInfo.address)
      ) {
        toast.error(
          'Please fill the following fields in order to use the sharing lists functionality: Contact person, Business Name, Website, Address!'
        );
        return false;
      }
    }

    return true;
  };

  const saveProviderInfo = async () => {
    if (!isSaveValid()) {
      return;
    }

    setIsDisabledWhileApiCall(true);
    const providerDataToUpdate = {
      address: providerInfo.address,
      contactPerson: providerInfo.contactPerson,
      website: providerInfo.website,
      email: providerInfo.email,
      country: providerInfo.country,
      minerId: providerInfo.minerId,
      businessName: providerInfo.businessName,
    };
    try {
      await ApiService.updateProvider({
        provider: providerDataToUpdate,
        config: {
          bitscreen: configInfo.bitscreen,
          share: configInfo.share,
          import: configInfo.import,
          safer: !!configInfo.safer,
        },
      });
      setConfig(configInfo);
      AuthService.patchAccount(providerDataToUpdate);
      toast.success('Successfully updated provider information!');
    } catch (e: any) {
      if (e && e.status === 401 && props.config) {
        toast.error(e.data.message);
        return logout();
      }
      toast.error(e.data.message);
      LoggerService.error(e);
    } finally {
      setIsDisabledWhileApiCall(false);
    }
  };

  const handleDeleteClose = (shouldDelete: boolean) => {
    setShowDeleteModal(false);
    LoggerService.info('Hiding Delete account modal.');

    if (shouldDelete) {
      setProvider(null);
      setConfig(null);
      AuthService.removeAccount();
      return logout();
    }
  };

  const handleSelectAccountClose = async (accountType: AccountType) => {
    setShowSelectAccount(false);

    try {
      await ApiService.selectAccountType(accountType);
      const provider = { ...providerInfo, accountType };
      AuthService.patchAccount({
        accountType,
      });
      setProviderInfo(provider);
      setProvider(provider);
      setShowQuickstartGuide(true);
    } catch (e: any) {
      if (e && e.status === 401 && props.config) {
        toast.error(e.data.message);
        return logout();
      }
      toast.error(
        "Couldn't update the provider information. Please try again later!"
      );
      LoggerService.error(e);
    } finally {
      setIsDisabledWhileApiCall(false);
    }
  };

  const handleQuickstartGuideClose = async () => {
    setShowQuickstartGuide(false);

    if (!providerInfo.guideShown) {
      setIsDisabledWhileApiCall(true);

      try {
        await ApiService.markQuickstartShown();
        AuthService.patchAccount({
          guideShown: true,
        });
        setProviderInfo({
          ...providerInfo,
          guideShown: true,
        });
        setProvider({
          ...providerInfo,
          guideShown: true,
        });
      } catch (e: any) {
        if (e && e.status === 401 && props.config) {
          toast.error(e.data.message);
          return logout();
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

  const switchAccountType = async () => {
    setIsDisabledWhileApiCall(true);
    try {
      const newAccountType =
        providerInfo.accountType === AccountType.NodeOperator
          ? AccountType.Assessor
          : AccountType.NodeOperator;
      await ApiService.selectAccountType(newAccountType);
      toast.success('Account type successfully switched!');
      AuthService.patchAccount({
        accountType: newAccountType,
      });
      setProvider({
        ...providerInfo,
        accountType: newAccountType,
      });
      setProviderInfo({
        ...providerInfo,
        accountType: newAccountType,
      });
      if (newAccountType === AccountType.Assessor) {
        setConfig((config: Config) => ({
          ...config,
          import: false,
        }));
        setConfigInfo((config) => ({
          ...config,
          import: false,
        }));
      }
    } catch (e) {
      return toast.error('Please try again later!');
    } finally {
      setIsDisabledWhileApiCall(false);
    }
  };

  const clearForm = () => {
    setProviderInfo({
      ...providerInitialState,
      accountType: providerInfo.accountType,
      assessorId: providerInfo.assessorId,
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
              {providerInfo.walletAddressHashed && (
                <>
                  <div className="slice-title-row t-lp">Wallet connected</div>
                  <div className="slice-info address-info t-lp">
                    Address:{' '}
                    {displayedWalletAddress.canDisplay
                      ? displayedWalletAddress.walletAddress
                      : '[Metamask account not active]'}
                  </div>
                </>
              )}
            </div>
            <div className="section-slice">
              <div className="slice-title-row t-lp">Account type</div>
              {providerInfo.accountType && (
                <div className="slice-info address-info t-lp">
                  <span className="mr-2">
                    {providerInfo.accountType === AccountType.NodeOperator
                      ? 'Node operator'
                      : 'Assessor'}
                  </span>
                  (
                  <span onClick={switchAccountType} className="link">
                    Switch to{' '}
                    {providerInfo.accountType === AccountType.NodeOperator
                      ? 'Assessor only'
                      : 'Node operator'}
                  </span>
                  )
                </div>
              )}
            </div>
            <div
              aria-describedby="wallet-status-actions"
              className="wallet-status-actions d-flex justify-content-between align-items-center"
            >
              <div className="d-flex">
                <div className="logout-button mr-12px">
                  <Button
                    onClick={logout}
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
                      Link{' '}
                      {AuthService.getLoginType() === LoginType.Email
                        ? 'wallet'
                        : 'Google'}{' '}
                      account
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
                      import: !configInfo.bitscreen ? false : configInfo.import,
                      share: !configInfo.bitscreen ? false : configInfo.share,
                    })
                  }
                  name="filter-lists"
                />
              </div>
              <div className="slice-description t-ls">
                If you disable all BitScreen lists, no deals will be blocked.
              </div>
            </div>

            {configInfo.bitscreen &&
              providerInfo.accountType === AccountType.NodeOperator && (
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
                      className="link"
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
                      className="link"
                    >
                      Updater
                    </span>
                    )
                  </div>
                </div>
              )}

            {configInfo.bitscreen &&
              providerInfo &&
              providerInfo.accountType === AccountType.NodeOperator && (
                <div
                  aria-describedby="enable-safer-slice"
                  className="section-slice pb-16px"
                >
                  <div className="slice-title-row t-lp d-flex justify-content-between align-items-center">
                    <span>Enable enhanced filtering</span>
                    <HtmlSwitchComponent
                      color="primary"
                      checked={configInfo.import && configInfo.safer}
                      disabled={!configInfo.import}
                      onChange={() =>
                        setConfigInfo({
                          ...configInfo,
                          safer: !configInfo.safer,
                        })
                      }
                      name="filter-lists"
                    />
                  </div>
                  <div className="slice-description t-ls">
                    Use&nbsp;
                    <a
                      className="external-link"
                      href="https://safer.io"
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      Safer’s CSAM filter
                    </a>
                    &nbsp;to prevent storage & retrieval deals on your node
                    (Requires importing)
                  </div>
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
                        import:
                          providerInfo.accountType === AccountType.NodeOperator
                            ? true
                            : false,
                      })
                    }
                    name="filter-lists"
                  />
                </div>
                <div className="slice-description t-ls">
                  Share your filter lists with other Bitscreen users.{' '}
                  {providerInfo &&
                    providerInfo.accountType === AccountType.NodeOperator && (
                      <>
                        (Requires{' '}
                        <span
                          onClick={() =>
                            window.open(
                              'https://github.com/Murmuration-Labs/bitscreen',
                              '_blank'
                            )
                          }
                          className="link"
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
                          className="link"
                        >
                          Updater
                        </span>
                        )
                      </>
                    )}
                </div>
              </div>
            )}
            {(providerInfo.accountType === AccountType.Assessor ||
              (providerInfo.accountType == AccountType.NodeOperator &&
                configInfo.bitscreen &&
                (configInfo.import || configInfo.share))) && (
              <div className="section-slice pb-16px">
                <div className="slice-title-row t-lp d-flex justify-content-between align-items-center">
                  <span>Required contact info</span>
                </div>
                <div className="slice-description t-ls">
                  Contact information{' '}
                  {(configInfo.import || configInfo.share) &&
                    `is required in order to use the${' '}`}
                  {configInfo.import &&
                    !configInfo.share &&
                    'importing lists functionality'}
                  {configInfo.import &&
                    configInfo.share &&
                    'importing and sharing lists functionalities'}
                  {providerInfo.accountType === AccountType.Assessor &&
                    configInfo.share &&
                    'sharing list functionality'}
                  {(configInfo.import || configInfo.share) && '. It'} is{' '}
                  {(configInfo.import || configInfo.share) && 'also'} required
                  for assessing complaints on Rodeo and it will be made public
                  via your assessor profile page in the Looking Glass
                  transparency hub.
                </div>
                <div
                  aria-describedby="share-toggled-area"
                  className="d-flex flex-column"
                >
                  {(providerInfo.accountType === AccountType.Assessor ||
                    configInfo.share) && (
                    <>
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
                    </>
                  )}
                  {(providerInfo.accountType === AccountType.Assessor ||
                    configInfo.import) && (
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
                  )}

                  {(providerInfo.accountType === AccountType.Assessor ||
                    configInfo.share) && (
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
                  )}
                  {(providerInfo.accountType === AccountType.Assessor ||
                    configInfo.import) && (
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
                  )}
                  {providerInfo.accountType === AccountType.NodeOperator &&
                    configInfo.import && (
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
                    )}
                </div>
              </div>
            )}

            {providerInfo.accountType === AccountType.NodeOperator && (
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
            {(providerInfo.accountType === AccountType.Assessor ||
              configInfo.bitscreen ||
              (config?.bitscreen && !configInfo.bitscreen)) && (
              <div
                aria-describedby="form-actions-slice"
                className="section-slice d-flex"
              >
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
              {providerInfo.accountType === AccountType.NodeOperator && (
                <>
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
                </>
              )}
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
            {providerInfo.accountType === AccountType.NodeOperator && (
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
                        Checks list manager for CIDs requested by BitScreen
                        plugin
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
            )}
          </div>
          <div className="section connections">
            <div className="section-title">App connections</div>
            <div aria-describedby="tools-slice" className="section-slice tools">
              <div className="slice-info pb-8px t-lp d-flex justify-content-between align-items-center">
                <span>Rodeo</span>
                <div className="check-icon">
                  {providerInfo.assessorId ? (
                    <img width={16} src={activeIcon}></img>
                  ) : (
                    <img width={16} src={inactiveIcon}></img>
                  )}
                </div>
              </div>
              {providerInfo.assessorId && (
                <>
                  <div className="slice-info pb-8px t-lp d-flex justify-content-between align-items-center">
                    <span>Looking Glass</span>
                    <a
                      className="app-connections-connect-button c-pointer no-text-select fs-14 lh-20 fw-500 external-link text-underline"
                      target="_blank"
                      href={`${lookingGlassUri()}/assessors/${
                        providerInfo.assessorId
                      }`}
                    >
                      Launch
                    </a>
                  </div>
                </>
              )}
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
        {(providerInfo.accountType === AccountType.Assessor ||
          (config && config.bitscreen)) && (
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
      <SelectAccountType
        show={showSelectAccount}
        handleClose={handleSelectAccountClose}
        logout={logout}
      />
      <QuickstartGuide
        accountType={providerInfo.accountType!}
        show={showQuickstartGuide}
        handleClose={handleQuickstartGuideClose}
      />
    </div>
  );
}

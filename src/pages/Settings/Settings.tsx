import {
  createStyles,
  Divider,
  makeStyles,
  TextField,
  Theme,
} from "@material-ui/core";
import Autocomplete from "@material-ui/lab/Autocomplete";
import detectEthereumProvider from "@metamask/detect-provider";
import axios from "axios";
import { countries } from "countries-list";
import _ from "lodash";
import React, { ComponentType, MouseEvent, useEffect, useState } from "react";
import { Button, Col, Container, Form, FormCheck, Row } from "react-bootstrap";
import { Prompt } from "react-router";
import { toast } from "react-toastify";
import validator from "validator";
import { serverUri } from "../../config";
import ApiService from "../../services/ApiService";
import * as AuthService from "../../services/AuthService";
import { Config, SettingsProps } from "../Filters/Interfaces";
import "./Settings.css";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
      flexWrap: "wrap",
    },
    textField: {
      marginBottom: theme.spacing(2),
    },
  })
);

export default function Settings(props: ComponentType<SettingsProps>) {
  const classes = useStyles();

  const [configuration, setConfiguration] = useState<Config>({
    bitscreen: false,
    import: false,
    share: false,
  });

  const [loading, setLoading] = useState(false);

  const [displayInfoSuccess, setDisplayInfoSuccess] = useState<boolean>(false);
  const [displayInfoError, setDisplayInfoError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [infoErrorMessage, setInfoErrorMessage] = useState<string>("");
  const [account, setAccount] = useState(AuthService.getAccount());
  const [loggedIn, setLoggedIn] = useState(false);
  const [disableButton, setDisableButton] = useState(false);

  const disconnectMetamask = () => {
    setLoggedIn(false);
    AuthService.removeAccount();
  };

  const connectWithMetamask = async (e) => {
    const provider: any = await detectEthereumProvider({
      mustBeMetaMask: true,
    });

    if (!provider) {
      return window.open("https://metamask.io/", "_blank");
    }

    if (parseInt(provider.chainId) !== 1) {
      return alert(`Please switch to Mainnet.`);
    }

    provider
      .request({ method: "eth_requestAccounts" })
      .then((_wallets: string[]) =>
        AuthService.updateAccount({
          ...AuthService.getAccount(),
          walletAddress: _wallets[0],
        })
      )
      .catch((error: any) =>
        console.error("Permission to wallets required", error)
      );
  };

  useEffect(() => {
    const providerId = AuthService.getProviderId();
    axios.get(`${serverUri()}/config/${providerId}`).then((response) => {
      const config = response.data;

      setConfiguration(config);
    });
  }, [loggedIn]);

  const putConfig = async (config: Config): Promise<void> => {
    const providerId = AuthService.getProviderId();
    await axios.put(`${serverUri()}/config`, { providerId, ...config });
  };

  const toggleBitScreen = async (): Promise<void> => {
    const newConfig = {
      ...configuration,
      bitscreen: !configuration.bitscreen,
    };
    setConfiguration(newConfig);
    putConfig(newConfig);
  };

  const toggleImportingLists = async (): Promise<void> => {
    const newConfig = {
      ...configuration,
      import: !configuration.import,
    };
    setConfiguration(newConfig);
    putConfig(newConfig);
  };

  const toggleSharingLists = async (): Promise<void> => {
    const newConfig = {
      ...configuration,
      share: !configuration.share,
    };
    setConfiguration(newConfig);
    putConfig(newConfig);
  };

  useEffect(() => {
    if (!account || !account.walletAddress) {
      setLoggedIn(false);
      return;
    }

    if (account?.accessToken) {
      setLoggedIn(true);
      return;
    }

    if (loggedIn) {
      return;
    }

    const wallet = account.walletAddress;

    setLoading(true);

    ApiService.getProvider(wallet)
      .then(async (provider) => {
        if (provider) {
          ApiService.authenticateProvider(provider).then((acc) => {
            setLoggedIn(true);
            AuthService.updateAccount(acc);
          });
          return;
        }

        await ApiService.createProvider(wallet)
          .then((_provider) => {
            ApiService.authenticateProvider(_provider).then((acc) => {
              setLoggedIn(true);
              AuthService.updateAccount(acc);
            });
            return;
          })
          .catch((_e) => {
            setLoggedIn(false);
            setErrorMessage("Error Logging In");
          });
      })
      .catch((_e) => {
        setLoggedIn(false);
        setErrorMessage("Error Logging In");
      });
  }, [account, loggedIn]);

  useEffect(() => AuthService.subscribe(setAccount), []);

  const unsavedChanges = () => {
    return !_.isEqual(account, AuthService.getAccount());
  };

  const uncompletedInfo = () => {
    const missingBitscreenData = !account;
    const missingImportData = configuration.import && !account?.country;
    const missingShareData =
      configuration.share &&
      (!account?.businessName ||
        !account?.website ||
        !account?.contactPerson ||
        !account?.email ||
        !account?.address);
    return missingBitscreenData || missingImportData || missingShareData;
  };

  const clearInputInfo = () => {
    if (!account) {
      return;
    }

    setAccount({
      ...account,
      businessName: "",
      website: "",
      email: "",
      contactPerson: "",
      address: "",
    });
  };

  const countryNames = Object.values(countries);

  return (
    <>
      <div
        style={{
          fontSize: 32,
          fontWeight: 600,
          marginBottom: "1rem",
          lineHeight: "40px",
        }}
      >
        Settings
      </div>
      <Row
        className="mx-0"
        style={{
          borderWidth: 1,
          borderColor: "#DFE1E6",
          borderStyle: "solid",
          borderRadius: 10,
          paddingTop: 20,
          paddingBottom: 20,
          paddingLeft: 40,
          paddingRight: 40,
        }}
      >
        <Col className="pl-0">
          <Row>
            <Col>
              <FormCheck
                type="switch"
                id="bitscreen-switch"
                label="Filter content using BitScreen"
                checked={configuration.bitscreen}
                onChange={() => toggleBitScreen()}
              />
              <p className="text-dim">
                Filtering enables a node operator to decline storage and
                retrieval deals for known CIDs.{" "}
                <a
                  className="text-dim"
                  href="https://github.com/Murmuration-Labs/bitscreen"
                >
                  (Find out more)
                </a>
              </p>
            </Col>
          </Row>
          {configuration.bitscreen && (
            <Row>
              <Col>
                {!loggedIn && (
                  <div className="ml-3">
                    <Row>
                      <Col>
                        <Form.Label>
                          <u>Please connect with you FIL Wallet Address</u>
                        </Form.Label>
                      </Col>
                    </Row>
                  </div>
                )}

                {!loggedIn && (
                  <div className="ml-3">
                    <Row>
                      <Col>
                        <p className="text-dim">
                          Linking a wallet address is required to activate
                          BitScreen. Your wallet address is used to access your
                          lists, and is stored hashed for statistical purposes.
                        </p>
                      </Col>
                    </Row>
                  </div>
                )}

                {account && account.walletAddress && (
                  <div className="ml-3">
                    <Row>
                      <Col>
                        <div className="filter-page-input-label">
                          FIL wallet address
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <p style={{ fontStyle: "oblique", fontWeight: "bold" }}>
                          {account.walletAddress}
                        </p>
                      </Col>
                    </Row>
                  </div>
                )}

                <div className="ml-3">
                  <Row>
                    <Col>
                      <Button
                        onClick={
                          loggedIn ? disconnectMetamask : connectWithMetamask
                        }
                      >
                        {loggedIn ? "Log Out" : "Connect with Metamask"}
                      </Button>
                    </Col>
                  </Row>
                </div>
                <Row>
                  <Col className="pt-2 pb-2"></Col>
                </Row>
                {loggedIn && (
                  <Row>
                    <Col>
                      <FormCheck
                        type="switch"
                        id="import-switch"
                        label="Activate Importing Lists"
                        checked={configuration.import}
                        onChange={() => toggleImportingLists()}
                      />
                      <p className="text-dim">
                        Importing lists from other users is an optional feature
                        that requires adding country information, which is used
                        for statistical purposes.
                      </p>
                    </Col>
                  </Row>
                )}

                {loggedIn &&
                  account &&
                  (configuration.import || configuration.share) && (
                    <>
                      <div className="ml-3">
                        <Row>
                          <Col>
                            <Autocomplete
                              options={countryNames}
                              getOptionLabel={(e) => e.name}
                              value={
                                countryNames.filter(
                                  (x) => x.name === account.country
                                )[0]
                              }
                              renderInput={(params) => (
                                <TextField
                                  label="Country"
                                  variant="outlined"
                                  placeholder="Country"
                                  {...params}
                                />
                              )}
                              onChange={(e, country) =>
                                setAccount({
                                  ...account,
                                  country: country ? country.name : "",
                                })
                              }
                            />
                          </Col>
                        </Row>
                      </div>

                      <Row>
                        <Col
                          className={`${
                            account &&
                            (configuration.import || configuration.share)
                              ? "pt-3"
                              : ""
                          } pb-2`}
                        ></Col>
                      </Row>
                    </>
                  )}

                {loggedIn && account && (
                  <Row>
                    <Col>
                      <FormCheck
                        type="switch"
                        id="share-switch"
                        label="Activate Sharing Lists"
                        checked={configuration.share}
                        onChange={() => toggleSharingLists()}
                      />
                      <p className="text-dim">
                        Sharing lists with other users is an optional feature
                        that requires adding list provider data, which is made
                        public to other users when you share lists.
                      </p>
                    </Col>
                  </Row>
                )}

                {loggedIn && account && configuration.share && (
                  <div className="ml-3">
                    <Row>
                      <Col>
                        <form
                          className={classes.root}
                          noValidate
                          autoComplete="false"
                        >
                          <TextField
                            fullWidth
                            className={classes.textField}
                            label="Business Name"
                            variant="outlined"
                            value={account.businessName || ""}
                            onChange={(ev) =>
                              setAccount({
                                ...account,
                                businessName: ev.target.value,
                              })
                            }
                          />
                          <TextField
                            fullWidth
                            className={classes.textField}
                            label="Website"
                            variant="outlined"
                            value={account.website || ""}
                            onChange={(ev) =>
                              setAccount({
                                ...account,
                                website: ev.target.value,
                              })
                            }
                          />
                          <TextField
                            fullWidth
                            className={classes.textField}
                            type="email"
                            label="Email"
                            variant="outlined"
                            value={account.email || ""}
                            onChange={(ev) =>
                              setAccount({ ...account, email: ev.target.value })
                            }
                          />
                          <TextField
                            fullWidth
                            className={classes.textField}
                            type="name"
                            label="Contact Person"
                            variant="outlined"
                            value={account.contactPerson || ""}
                            onChange={(ev) =>
                              setAccount({
                                ...account,
                                contactPerson: ev.target.value,
                              })
                            }
                          />
                          <TextField
                            fullWidth
                            className={classes.textField}
                            type="address"
                            label="Address"
                            variant="outlined"
                            value={account.address || ""}
                            onChange={(ev) =>
                              setAccount({
                                ...account,
                                address: ev.target.value,
                              })
                            }
                          />
                        </form>
                      </Col>
                    </Row>
                  </div>
                )}

                {loggedIn &&
                  account &&
                  (configuration.import || configuration.share) && (
                    <Row>
                      <Col>
                        <Button
                          variant="primary"
                          className="mr-3"
                          type="button"
                          disabled={disableButton}
                          onClick={(ev: MouseEvent<HTMLElement>) => {
                            ev.preventDefault();

                            // validations here
                            if (
                              configuration.share &&
                              account.email &&
                              !validator.isEmail(account.email)
                            ) {
                              toast.error("Email is not valid");
                              return;
                            }

                            if (
                              configuration.share &&
                              account.website &&
                              !validator.isURL(account.website)
                            ) {
                              toast.error("Website is not a valid URL");
                              return;
                            }

                            setDisableButton(true);

                            let updatedAccount = account;
                            const fetchedAccount = AuthService.getAccount();
                            if (!configuration.share && fetchedAccount) {
                              updatedAccount = {
                                ...fetchedAccount,
                                country: account.country,
                              };
                            }
                            ApiService.updateProvider(updatedAccount)
                              .then(() => {
                                AuthService.updateAccount(updatedAccount);
                                toast.success(
                                  "Successfully saved information."
                                );
                                setDisableButton(false);
                              })
                              .catch(() => {
                                toast.error("Something went wrong");
                                setDisableButton(false);
                              });
                          }}
                        >
                          Save
                        </Button>
                        {configuration.share && (
                          <Button
                            onClick={() => {
                              clearInputInfo();
                            }}
                          >
                            Clear
                          </Button>
                        )}
                      </Col>
                    </Row>
                  )}
                <Prompt
                  when={unsavedChanges() || uncompletedInfo()}
                  message={
                    unsavedChanges()
                      ? "You have unsaved changes, are you sure you want to leave?"
                      : "You have activated a toggle but did not enter relevant data, are you sure you want to leave?"
                  }
                />
              </Col>
            </Row>
          )}
        </Col>
      </Row>
    </>
  );
}

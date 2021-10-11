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
import { Account } from "../Contact/Interfaces";
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

export default function Settings(props) {
  const { connectMetamask, account, setAccount, config, setConfig } = props;

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
  const [accountInfo, setAccountInfo] = useState<Account>({
    id: 0,
    walletAddressHashed: "",
    businessName: "",
    website: "",
    email: "",
    contactPerson: "",
    address: "",
    nonce: "",
  });
  const [loggedIn, setLoggedIn] = useState(false);
  const [disableButton, setDisableButton] = useState(false);

  const [autocompleteInput, setAutocompleteInput] = useState("");

  useEffect(() => {
    setConfiguration({ ...config });
  }, [props.config]);

  useEffect(() => {
    setAccountInfo({ ...account });
  }, [props.account]);

  const toggleBitScreen = async (): Promise<void> => {
    const newConfig = {
      ...configuration,
      bitscreen: !configuration.bitscreen,
    };
    setConfiguration(newConfig);
  };

  const toggleImportingLists = async (): Promise<void> => {
    const newConfig = {
      ...configuration,
      import: !configuration.import,
    };
    setConfiguration(newConfig);
  };

  const toggleSharingLists = async (): Promise<void> => {
    const newConfig = {
      ...configuration,
      share: !configuration.share,
    };
    setConfiguration(newConfig);
  };

  useEffect(() => {
    if (!accountInfo || !accountInfo.walletAddress) {
      setLoggedIn(false);
      return;
    }

    if (accountInfo?.accessToken) {
      setLoggedIn(true);
      return;
    }
  }, [accountInfo]);

  const unsavedChanges = () => {
    return !_.isEqual(accountInfo, AuthService.getAccount());
  };

  const uncompletedInfo = () => {
    const missingBitscreenData = !accountInfo;
    const missingImportData = configuration.import && !accountInfo?.country;
    const missingShareData =
      configuration.share &&
      (!accountInfo?.businessName ||
        !accountInfo?.website ||
        !accountInfo?.contactPerson ||
        !accountInfo?.email ||
        !accountInfo?.address);
    return missingBitscreenData || missingImportData || missingShareData;
  };

  const clearInputInfo = () => {
    if (!accountInfo) {
      return;
    }

    setAccountInfo({
      ...accountInfo,
      businessName: "",
      website: "",
      email: "",
      contactPerson: "",
      address: "",
    });
  };

  const saveAccountConfiguration = async () => {
    if (
      configuration.share &&
      accountInfo.email &&
      !validator.isEmail(accountInfo.email)
    ) {
      toast.error("Email is not valid");
      return;
    }

    if (
      configuration.share &&
      accountInfo.website &&
      !validator.isURL(accountInfo.website)
    ) {
      toast.error("Website is not a valid URL");
      return;
    }

    setDisableButton(true);

    let updatedAccount = accountInfo;
    const currentAccount = { ...account };
    if (!configuration.share && currentAccount) {
      updatedAccount = {
        ...currentAccount,
        country: accountInfo.country,
      };
    }

    try {
      const config = await ApiService.setProviderConfig({ ...configuration });
      setConfig(config);
    } catch (e) {
      toast.error(
        "Couldn't update the provider configuration. Please try again later!"
      );
      setDisableButton(false);
      return;
    }

    try {
      const account = await ApiService.updateProvider(updatedAccount);
      setAccount(account);
      AuthService.updateAccount(account);
    } catch (e) {
      toast.error(
        "Couldn't update the account information. Please try again later!"
      );
      setDisableButton(false);
      return;
    }

    toast.success("Successfully saved information.");
    setDisableButton(false);
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
                checked={configuration.bitscreen || false}
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
                          <u>Please connect a wallet</u>
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

                {accountInfo && accountInfo.walletAddress && (
                  <div className="ml-3">
                    <Row>
                      <Col>
                        <div className="filter-page-input-label">
                          wallet address
                        </div>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <p style={{ fontStyle: "oblique", fontWeight: "bold" }}>
                          {accountInfo.walletAddress}
                        </p>
                      </Col>
                    </Row>
                  </div>
                )}

                <div className="ml-3">
                  <Row>
                    <Col>
                      {!loggedIn ? (
                        <Button onClick={connectMetamask}>
                          Connect with Metamask
                        </Button>
                      ) : null}
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
                        checked={configuration.import || false}
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

                {loggedIn && (configuration.import || configuration.share) && (
                  <>
                    <div className="ml-3">
                      <Row>
                        <Col>
                          <Autocomplete
                            options={countryNames}
                            getOptionLabel={(e) => e.name}
                            value={
                              countryNames.filter(
                                (x) => x.name === accountInfo.country
                              )[0] || null
                            }
                            inputValue={autocompleteInput || ""}
                            onInputChange={(_, newInputValue) => {
                              setAutocompleteInput(newInputValue);
                            }}
                            renderInput={(params) => (
                              <TextField
                                label="Country"
                                variant="outlined"
                                placeholder="Country"
                                {...params}
                              />
                            )}
                            onChange={(e, country) =>
                              setAccountInfo({
                                ...accountInfo,
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
                          accountInfo &&
                          (configuration.import || configuration.share)
                            ? "pt-3"
                            : ""
                        } pb-2`}
                      ></Col>
                    </Row>
                  </>
                )}

                {loggedIn && (
                  <Row>
                    <Col>
                      <FormCheck
                        type="switch"
                        id="share-switch"
                        label="Activate Sharing Lists"
                        checked={configuration.share || false}
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

                {loggedIn && configuration.share && (
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
                            value={accountInfo.businessName || ""}
                            onChange={(ev) =>
                              setAccountInfo({
                                ...accountInfo,
                                businessName: ev.target.value,
                              })
                            }
                          />
                          <TextField
                            fullWidth
                            className={classes.textField}
                            label="Website"
                            variant="outlined"
                            value={accountInfo.website || ""}
                            onChange={(ev) =>
                              setAccountInfo({
                                ...accountInfo,
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
                            value={accountInfo.email || ""}
                            onChange={(ev) =>
                              setAccountInfo({
                                ...accountInfo,
                                email: ev.target.value,
                              })
                            }
                          />
                          <TextField
                            fullWidth
                            className={classes.textField}
                            type="name"
                            label="Contact Person"
                            variant="outlined"
                            value={accountInfo.contactPerson || ""}
                            onChange={(ev) =>
                              setAccountInfo({
                                ...accountInfo,
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
                            value={accountInfo.address || ""}
                            onChange={(ev) =>
                              setAccountInfo({
                                ...accountInfo,
                                address: ev.target.value,
                              })
                            }
                          />
                        </form>
                      </Col>
                    </Row>
                  </div>
                )}

                {loggedIn && (configuration.import || configuration.share) && (
                  <Row>
                    <Col>
                      <Button
                        variant="primary"
                        className="mr-3"
                        type="button"
                        disabled={disableButton}
                        onClick={saveAccountConfiguration}
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

import { createStyles, makeStyles, Theme } from "@material-ui/core";
import { countries } from "countries-list";
import _ from "lodash";
import React, { useEffect, useState } from "react";
import { Button, Col, Container, Form, FormCheck, Row } from "react-bootstrap";
import { Prompt } from "react-router";
import { toast } from "react-toastify";
import validator from "validator";
import ApiService from "../../services/ApiService";
import * as AuthService from "../../services/AuthService";
import { Account } from "../../types/interfaces";
import { Config, SettingsProps } from "../Filters/Interfaces";
import "./Settings.css";
import { Option, Typeahead } from "react-bootstrap-typeahead";
import DeleteAccountModal from "./DeleteAccountModal";
import LoggerService from "../../services/LoggerService";
import HttpService from "../../services/HttpService";

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

  const [selectedCountryOption, setSelectedCountryOption] = useState<Option[]>(
    []
  );

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  useEffect(() => LoggerService.info("Loading Settings page."), []);

  useEffect(() => {
    setConfiguration({ ...config });
  }, [props.config]);

  useEffect(() => {
    setAccountInfo({ ...account });
    if (account && account.country) {
      setSelectedCountryOption([account.country]);
    }
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

  const handleDeleteClose = (result: boolean) => {
    setShowDeleteModal(false);
    LoggerService.info("Hiding Delete account modal.");

    if (result) {
      setAccount(null);
      setConfig(null);
      AuthService.removeAccount();
    }
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
    } catch (e: any) {
      if (e.status === 401) {
        toast.error(e.data.message);
        return;
      }
      toast.error(
        "Couldn't update the provider configuration. Please try again later!"
      );
      setDisableButton(false);
      LoggerService.error(e);
      return;
    }

    try {
      const account = await ApiService.updateProvider(updatedAccount);
      setAccount(account);
      AuthService.updateAccount(account);
    } catch (e: any) {
      if (e.status === 401) {
        toast.error(e.data.message);
        return;
      }
      toast.error(
        "Couldn't update the account information. Please try again later!"
      );
      setDisableButton(false);
      LoggerService.error(e);
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
            <Row className="settings-width">
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
                          Wallet Address
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
                        label='Activate "Importing Lists"'
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
                          <div className="input-label">Country</div>
                          <Typeahead
                            id="country"
                            options={countryNames.map(
                              (country) => country.name
                            )}
                            placeholder="Country"
                            onChange={(country) => {
                              setSelectedCountryOption(country);
                              setAccountInfo({
                                ...accountInfo,
                                country: country[0]
                                  ? (country[0] as string)
                                  : "",
                              });
                            }}
                            selected={selectedCountryOption}
                          ></Typeahead>
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
                        label='Activate "Sharing Lists"'
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
                          <div className="input-label">Business Name</div>
                          <Form.Control
                            role="businessName"
                            placeholder="Business Name"
                            className={classes.textField}
                            onChange={(ev) =>
                              setAccountInfo({
                                ...accountInfo,
                                businessName: ev.target.value,
                              })
                            }
                            type="text"
                            value={accountInfo.businessName || ""}
                          />

                          <div className="input-label">Website</div>
                          <Form.Control
                            role="website"
                            placeholder="Website"
                            className={classes.textField}
                            onChange={(ev) =>
                              setAccountInfo({
                                ...accountInfo,
                                website: ev.target.value,
                              })
                            }
                            type="text"
                            value={accountInfo.website || ""}
                          />

                          <div className="input-label">Email</div>
                          <Form.Control
                            role="email"
                            placeholder="Email"
                            className={classes.textField}
                            onChange={(ev) =>
                              setAccountInfo({
                                ...accountInfo,
                                email: ev.target.value,
                              })
                            }
                            type="text"
                            value={accountInfo.email || ""}
                          />

                          <div className="input-label">Contact Person</div>
                          <Form.Control
                            role="contactPerson"
                            placeholder="Contact Person"
                            className={classes.textField}
                            onChange={(ev) =>
                              setAccountInfo({
                                ...accountInfo,
                                contactPerson: ev.target.value,
                              })
                            }
                            type="text"
                            value={accountInfo.contactPerson || ""}
                          />

                          <div className="input-label">Address</div>
                          <Form.Control
                            role="address"
                            placeholder="Address"
                            className={classes.textField}
                            onChange={(ev) =>
                              setAccountInfo({
                                ...accountInfo,
                                address: ev.target.value,
                              })
                            }
                            type="text"
                            value={accountInfo.address || ""}
                          />
                        </form>
                      </Col>
                    </Row>
                  </div>
                )}

                {loggedIn && (configuration.import || configuration.share) && (
                  <Row>
                    <Col className="col-auto mr-auto">
                      <Button
                        variant="primary"
                        className="mr-3 settings-button"
                        type="button"
                        disabled={disableButton}
                        onClick={saveAccountConfiguration}
                      >
                        Save
                      </Button>
                      {configuration.share && (
                        <Button
                          className="settings-button"
                          onClick={() => {
                            clearInputInfo();
                          }}
                        >
                          Clear
                        </Button>
                      )}
                    </Col>
                    <Col className="col-auto">
                      <Button
                        variant="outline-primary"
                        className="double-space-left import-btn mr-3"
                        onClick={async () => {
                          try {
                            await ApiService.exportAccount();
                          } catch (e: any) {
                            if (e.status === 401) {
                              toast.error(e.data.message);
                              return;
                            }
                          }
                        }}
                      >
                        Export Account
                      </Button>
                      <Button
                        variant="danger"
                        type="button"
                        disabled={disableButton}
                        onClick={() => setShowDeleteModal(true)}
                      >
                        Delete Account
                      </Button>
                    </Col>
                  </Row>
                )}
                <Prompt
                  when={unsavedChanges() || uncompletedInfo()}
                  message={(location, action) => {
                    if (location.state) {
                      const { tokenExpired } = location.state as {
                        tokenExpired: boolean;
                      };
                      if (tokenExpired) {
                        return true;
                      }
                    }
                    return unsavedChanges()
                      ? "You have unsaved changes, are you sure you want to leave?"
                      : "You have activated a toggle but did not enter relevant data, are you sure you want to leave?";
                  }}
                />
              </Col>
            </Row>
          )}
        </Col>
      </Row>
      <DeleteAccountModal
        show={showDeleteModal}
        handleClose={handleDeleteClose}
      />
    </>
  );
}

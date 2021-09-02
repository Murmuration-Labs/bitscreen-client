import React, {
  ChangeEvent,
  ComponentType,
  useEffect,
  useState,
  MouseEvent,
} from "react";
import axios from "axios";

import { Button, Col, Container, Form, FormCheck, Row } from "react-bootstrap";
import { Prompt } from "react-router";
import { Typeahead } from "react-bootstrap-typeahead";
import "./Settings.css";
import { serverUri } from "../../config";
import { Config, SettingsProps } from "../Filters/Interfaces";
import * as AuthService from "../../services/AuthService";
import ApiService from "../../services/ApiService";
import { countries } from "countries-list";
import validator from "validator";
import _ from "lodash";
import detectEthereumProvider from "@metamask/detect-provider";

const API_MESSAGES_TIME = 1500;

export default function Settings(props: ComponentType<SettingsProps>) {
  const [configLoaded, setConfigLoaded] = useState<boolean>(false);
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
    axios.get(`${serverUri()}/config`).then((response) => {
      const config = response.data;

      setConfigLoaded(true);
      setConfiguration(config);
    });
  }, []);

  const putConfig = async (config: Config): Promise<void> => {
    await axios.put(`${serverUri()}/config`, config);
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
    if (loggedIn) {
      return;
    }

    if (account?.accessToken) {
      setLoggedIn(true);
      return;
    }

    if (!account || !account.walletAddress) {
      return;
    }

    const wallet = account.walletAddress;

    setLoading(true);

    ApiService.getProvider(wallet)
      .then(async (provider) => {
        if (provider) {
          console.log("GET PROVIDER", provider);
          ApiService.authenticateProvider(provider).then((acc) => {
            console.log("AUTH CREATED PROVIDER", acc);
            setLoggedIn(true);
            AuthService.updateAccount(acc);
          });
          return;
        }

        await ApiService.createProvider(wallet)
          .then((_provider) => {
            console.log("CREATE PROVIDER", _provider);
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

  const handleFieldChange = (
    key: string,
    ev: ChangeEvent<HTMLInputElement>
  ) => {
    if (!account) {
      return;
    }

    account[key] = ev.target.value;
    setAccount({
      ...account,
      [key]: ev.target.value,
    });
  };

  const unsavedChanges = () => {
    return !_.isEqual(account, AuthService.getAccount());
  };

  const uncompletedInfo = () => {
    const missingBitscreenData = configuration.bitscreen && !account;
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

  const showInfoError = (message: string) => {
    setInfoErrorMessage(message);
    setDisplayInfoError(true);

    setTimeout(() => {
      setInfoErrorMessage("");
      setDisplayInfoError(false);
    }, API_MESSAGES_TIME);
  };

  const countryNames = Object.values(countries);

  return (
    <Container>
      {configLoaded ? (
        <>
          <h2>Settings</h2>

          <Row className={"settings-block"}>
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
            <Form style={{ marginLeft: 12, marginTop: -20 }}>
              <Form.Group>
                <Form.Label>FIL wallet address</Form.Label>
                <br />
                {account && account.walletAddress && (
                  <p className="text-dim">{account.walletAddress}</p>
                )}
                <p className="text-dim">
                  Linking a wallet address is required to activate BitScreen.
                  Your wallet address is used to access your lists, and is
                  stored hashed for statistical purposes.
                </p>
              </Form.Group>
              <Row>
                <Col>
                  <Button disabled={loggedIn} onClick={connectWithMetamask}>
                    Connect with Metamask
                  </Button>
                </Col>
                <Col md="auto">
                  <Button
                    disabled={!loggedIn}
                    onClick={() => {
                      setLoggedIn(false);
                      AuthService.removeAccount();
                    }}
                  >
                    Log out
                  </Button>
                </Col>
              </Row>
            </Form>
          )}

          {configuration.bitscreen && loggedIn && (
            <Row className={"settings-block"} style={{ marginTop: 25 }}>
              <Col>
                <FormCheck
                  type="switch"
                  id="import-switch"
                  label="Activate Importing Lists"
                  checked={configuration.import}
                  onChange={() => toggleImportingLists()}
                />
                <p className="text-dim">
                  Importing lists from other users is an optional feature that
                  requires adding country information, which is used for
                  statistical purposes.
                </p>
              </Col>
            </Row>
          )}

          {configuration.bitscreen && account && (
            <Row className={"settings-block"}>
              <Col>
                <FormCheck
                  type="switch"
                  id="share-switch"
                  label="Activate Sharing Lists"
                  checked={configuration.share}
                  onChange={() => toggleSharingLists()}
                />
                <p className="text-dim">
                  Sharing lists with other users is an optional feature that
                  requires adding list provider data, which is made public to
                  other users when you share lists.
                </p>
              </Col>
            </Row>
          )}

          {configuration.bitscreen &&
            account &&
            (configuration.import || configuration.share) && (
              <Form style={{ marginLeft: 12, marginTop: -15 }}>
                <Form.Group>
                  <Form.Label>Country</Form.Label>
                  <Typeahead
                    id="typeahead-autocomplete"
                    labelKey="name"
                    selected={countryNames.filter(
                      (x) => x.name === account.country
                    )}
                    options={countryNames}
                    onChange={(selected) => {
                      if (selected.length === 0) {
                        account.country = "";
                      } else {
                        account.country = selected[0].name;
                      }

                      setAccount({ ...account });
                    }}
                    clearButton
                  />
                </Form.Group>
              </Form>
            )}

          {configuration.bitscreen && account && configuration.share && (
            <Form style={{ marginLeft: 12 }}>
              <Form.Group>
                <Form.Label>Business name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Business name"
                  value={account.businessName || ""}
                  onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                    handleFieldChange("businessName", ev)
                  }
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Website</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Website"
                  value={account.website || ""}
                  onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                    handleFieldChange("website", ev)
                  }
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Email"
                  value={account.email || ""}
                  onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                    handleFieldChange("email", ev)
                  }
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Contact person</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Contact person"
                  value={account.contactPerson || ""}
                  onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                    handleFieldChange("contactPerson", ev)
                  }
                />
              </Form.Group>
              <Form.Group>
                <Form.Label>Address</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Address"
                  value={account.address || ""}
                  onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                    handleFieldChange("address", ev)
                  }
                />
              </Form.Group>
            </Form>
          )}

          {configuration.bitscreen &&
            account &&
            (configuration.import || configuration.share) && (
              <Form style={{ marginLeft: 12 }}>
                <Row>
                  <Col xs="auto">
                    <Button
                      variant="primary"
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
                          showInfoError("Email is not valid");
                          return;
                        }

                        if (
                          configuration.share &&
                          account.website &&
                          !validator.isURL(account.website)
                        ) {
                          showInfoError("Website is not a valid URL");
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
                            setDisplayInfoSuccess(true);
                            setTimeout(() => {
                              setDisplayInfoSuccess(false);
                            }, API_MESSAGES_TIME);
                            setDisableButton(false);
                          })
                          .catch(() => {
                            showInfoError("Something went wrong");
                            setDisableButton(false);
                          });
                      }}
                    >
                      Save
                    </Button>
                  </Col>
                  <Col style={{ marginLeft: -20, marginTop: 5 }}>
                    {displayInfoSuccess && (
                      <span style={{ color: "green" }}>
                        Successfully updated info
                      </span>
                    )}
                    {displayInfoError && (
                      <span style={{ color: "red" }}>{infoErrorMessage}</span>
                    )}
                  </Col>
                  {configuration.share && (
                    <Col>
                      <Button
                        style={{ float: "right" }}
                        onClick={() => {
                          clearInputInfo();
                        }}
                      >
                        Clear
                      </Button>
                    </Col>
                  )}
                </Row>
              </Form>
            )}
          <div style={{ marginTop: 50 }} />
        </>
      ) : null}
      <Prompt
        when={unsavedChanges() || uncompletedInfo()}
        message={
          unsavedChanges()
            ? "You have unsaved changes, are you sure you want to leave?"
            : "You have activated a toggle but did not enter relevant data, are you sure you want to leave?"
        }
      />
    </Container>
  );
}

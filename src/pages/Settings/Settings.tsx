import React, {
  ChangeEvent,
  ComponentType,
  useEffect,
  useState,
  MouseEvent,
} from "react";
import axios from "axios";

import { Button, Col, Container, Form, FormCheck, Row } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import "./Settings.css";
import { serverUri } from "../../config";
import { Config, SettingsProps } from "../Filters/Interfaces";
import * as AuthService from "../../services/AuthService";
import ApiService from "../../services/ApiService";
import { countries } from "countries-list";
import validator from "validator";

const API_MESSAGES_TIME = 1500;

export default function Settings(props: ComponentType<SettingsProps>) {
  const [configLoaded, setConfigLoaded] = useState<boolean>(false);
  const [accountLoaded, setAccountLoaded] = useState<boolean>(false);
  const [configuration, setConfiguration] = useState<Config>({
    bitscreen: false,
    import: false,
    share: false,
  });

  useEffect(() => {
    async function setInitialConfig() {
      const response = await axios.get(`${serverUri()}/config`);
      const config = response.data;

      setConfigLoaded(true);
      setConfiguration(config);
    }

    setInitialConfig();
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

  const [displayCountrySuccess, setDisplayCountrySuccess] =
    useState<boolean>(false);
  const [displayCountryError, setDisplayCountryError] =
    useState<boolean>(false);
  const [displayInfoSuccess, setDisplayInfoSuccess] = useState<boolean>(false);
  const [displayInfoError, setDisplayInfoError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [account, setAccount] = useState(AuthService.getAccount());
  const [plainWallet, setPlainWallet] = useState(account?.walletAddress || "");
  const [loggedIn, setLoggedIn] = useState(!!account);
  const [disableImport, setDisableImport] = useState(false);
  const [disableShare, setDisableShare] = useState(false);
  const [isCountryAdded, setIsCountryAdded] = useState(
    account?.country ? true : false
  );

  useEffect(() => {
    setLoggedIn(!!account);
    switch (true) {
      case !account:
        AuthService.removeAccount();
        setPlainWallet("");
        setAccountLoaded(false);
        break;
      default:
        setPlainWallet(account?.walletAddress || "");
    }
  }, [account]);

  useEffect(() => {
    if (!accountLoaded && plainWallet) {
      (async () => {
        await ApiService.getProvider(plainWallet)
          .then((loadedAccount) => {
            setAccountLoaded(true);
            setAccount(loadedAccount);
          })
          .catch((err) => {
            console.error(err);

            setAccount(null);
          });
      })();
    } else {
      setAccountLoaded(true);
    }
  }, [accountLoaded, account]);

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

  const logIn = async () => {
    if (loggedIn || !plainWallet) {
      return;
    }

    const provider = await ApiService.getProvider(plainWallet).catch((_err) => {
      setErrorMessage("Error Logging In");
    });

    if (provider) {
      setAccount(provider);
      AuthService.updateAccount(provider);
      return;
    }

    await ApiService.createProvider(plainWallet)
      .then(logIn)
      .catch((_err) => {
        setErrorMessage("Error Logging In");
      });
  };

  const showInfoError = () => {
    setDisplayInfoError(true);
    setTimeout(() => {
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
                <p className="text-dim">
                  Linking a wallet address is required to activate BitScreen.
                  Your wallet address is used to access your lists, and is
                  stored hashed for statistical purposes.
                </p>
                <Row>
                  <Col>
                    <Form.Control
                      disabled={loggedIn}
                      type="text"
                      placeholder="FIL address"
                      value={account?.walletAddress || plainWallet}
                      onChange={(ev: ChangeEvent<HTMLInputElement>) => {
                        setPlainWallet(ev.target.value);
                        handleFieldChange("walletAddress", ev);
                      }}
                      onKeyDown={(
                        event: React.KeyboardEvent<HTMLInputElement>
                      ) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          if (!loggedIn) {
                            logIn();
                          }
                        }
                      }}
                    />
                  </Col>
                </Row>
              </Form.Group>
              <Row>
                <Col>
                  <Button
                    disabled={loggedIn}
                    onClick={(e) => {
                      if (!loggedIn) {
                        logIn();
                      }
                    }}
                  >
                    Save
                  </Button>
                </Col>
                <Col md="auto">
                  <Button disabled={!loggedIn} onClick={() => setAccount(null)}>
                    Log out
                  </Button>
                </Col>
              </Row>
            </Form>
          )}

          {configuration.bitscreen && account && (
            <Row className={"settings-block"} style={{ marginTop: 30 }}>
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
          {configuration.bitscreen && account && configuration.import && (
            <Form style={{ marginLeft: 12, marginTop: -20 }}>
              <Form.Group>
                <Form.Label>Country</Form.Label>
                <Typeahead
                  id="typeahead-autocomplete"
                  labelKey="name"
                  defaultSelected={
                    account.country
                      ? countryNames.filter((x) => x.name === account.country)
                      : []
                  }
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
              <Row>
                <Col xs="auto">
                  <Button
                    variant="primary"
                    type="button"
                    disabled={disableImport}
                    onClick={(ev: MouseEvent<HTMLElement>) => {
                      ev.preventDefault();
                      setDisableImport(true);
                      ApiService.updateProvider(account)
                        .then(() => {
                          AuthService.updateAccount(account);
                          if (account.country) {
                            setIsCountryAdded(true);
                          } else {
                            setIsCountryAdded(false);
                          }

                          setDisplayCountrySuccess(true);
                          setTimeout(() => {
                            setDisplayCountrySuccess(false);
                          }, API_MESSAGES_TIME);
                          setDisableImport(false);
                        })
                        .catch(() => {
                          setDisplayCountryError(true);
                          setTimeout(() => {
                            setDisplayCountryError(false);
                          }, API_MESSAGES_TIME);
                          setDisableImport(false);
                        });
                    }}
                  >
                    Save
                  </Button>
                </Col>
                <Col style={{ marginLeft: -20, marginTop: 5 }}>
                  {displayCountrySuccess && (
                    <span style={{ color: "green" }}>
                      Successfully updated country
                    </span>
                  )}
                  {displayCountryError && (
                    <span style={{ color: "red" }}>Something went wrong</span>
                  )}
                </Col>
              </Row>
            </Form>
          )}

          {configuration.bitscreen &&
            account &&
            configuration.import &&
            isCountryAdded && (
              <Row className={"settings-block"} style={{ marginTop: 30 }}>
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
            configuration.import &&
            isCountryAdded &&
            configuration.share && (
              <Form style={{ marginLeft: 12, marginTop: -20 }}>
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
                <Row>
                  <Col xs="auto">
                    <Button
                      variant="primary"
                      type="button"
                      disabled={disableShare}
                      onClick={(ev: MouseEvent<HTMLElement>) => {
                        ev.preventDefault();

                        // validations here
                        if (
                          account.email &&
                          !validator.isEmail(account.email)
                        ) {
                          showInfoError();
                          return;
                        }

                        if (
                          account.website &&
                          !validator.isURL(account.website)
                        ) {
                          showInfoError();
                          return;
                        }

                        setDisableShare(true);
                        ApiService.updateProvider(account)
                          .then(() => {
                            AuthService.updateAccount(account);
                            setDisplayInfoSuccess(true);
                            setTimeout(() => {
                              setDisplayInfoSuccess(false);
                            }, API_MESSAGES_TIME);
                            setDisableShare(false);
                          })
                          .catch(() => {
                            showInfoError();
                            setDisableShare(false);
                          });
                      }}
                    >
                      Save
                    </Button>
                  </Col>
                  <Col style={{ marginLeft: -20, marginTop: 5 }}>
                    {displayInfoSuccess && (
                      <span style={{ color: "green" }}>
                        Successfully updated contact info
                      </span>
                    )}
                    {displayInfoError && (
                      <span style={{ color: "red" }}>Something went wrong</span>
                    )}
                  </Col>
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
                </Row>
              </Form>
            )}
          <div style={{ marginTop: 50 }} />
        </>
      ) : null}
    </Container>
  );
}

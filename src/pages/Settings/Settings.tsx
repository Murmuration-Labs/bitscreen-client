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

export default function Settings(props: ComponentType<SettingsProps>) {
  const [configLoaded, setConfigLoaded] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);
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

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [account, setAccount] = useState(AuthService.getAccount());
  const [plainWallet, setPlainWallet] = useState(account?.walletAddress || "");
  const [loggedIn, setLoggedIn] = useState(!!account);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!account);
    switch (true) {
      case !account:
        AuthService.removeAccount();
        setPlainWallet("");
        setLoggingIn(false);
        setLoaded(false);
        break;
      default:
        setPlainWallet(account?.walletAddress || "");
    }
  }, [account]);

  useEffect(() => {
    if (!loaded && plainWallet) {
      (async () => {
        await ApiService.getProvider(plainWallet)
          .then((loadedAccount) => {
            setLoaded(true);
            setAccount(loadedAccount);
          })
          .catch((err) => {
            console.error(err);

            setAccount(null);
          });
      })();
    } else {
      setLoaded(true);
    }
  }, [loaded, account]);

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

  const logIn = async () => {
    if (loggingIn || !plainWallet) {
      return;
    }

    setLoggingIn(true);

    const provider = await ApiService.getProvider(plainWallet).catch((_err) => {
      setLoggingIn(false);
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
        setLoggingIn(false);
        setErrorMessage("Error Logging In");
      });
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
            <Form style={{ marginLeft: 12 }}>
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
                          if (!loggingIn) {
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
                    disabled={loggingIn}
                    onClick={(e) => {
                      if (!loggingIn) {
                        logIn();
                      }
                    }}
                  >
                    Save
                  </Button>
                </Col>
                <Col md="auto">
                  <Button onClick={() => setAccount(null)}>Clear</Button>
                </Col>
              </Row>
            </Form>
          )}

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
          {account && configuration.import && (
            <Form style={{ marginLeft: 12 }}>
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
                <Col>
                  <Button
                    variant="primary"
                    type="button"
                    onClick={(ev: MouseEvent<HTMLElement>) => {
                      ev.preventDefault();
                      ApiService.updateProvider(account).then(() => {
                        AuthService.updateAccount(account);
                      });
                    }}
                  >
                    Save
                  </Button>
                </Col>
              </Row>
            </Form>
          )}

          <Row className={"settings-block"} style={{ marginTop: 25 }}>
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

          {account && configuration.share && (
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
        </>
      ) : null}
    </Container>
  );
}

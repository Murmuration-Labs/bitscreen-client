import React, {
  ChangeEvent,
  ComponentType,
  FormEvent,
  useEffect,
  useState,
  MouseEvent,
} from "react";
import axios from "axios";

import {
  Button,
  Col,
  Container,
  Form,
  FormCheck,
  FormGroup,
  Row,
} from "react-bootstrap";
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
  const [loaded, setLoaded] = useState<boolean>(false);
  const [configuration, setConfiguration] = useState<Config>({
    bitscreen: false,
    share: false,
    advanced: {
      enabled: false,
      list: [],
    },
    filters: {
      external: false,
      internal: false,
    },
  });

  useEffect(() => {
    async function setInitialConfig() {
      const response = await axios.get(`${serverUri()}/config`);
      const config = response.data;

      setLoaded(true);
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

  const toggleShare = async (): Promise<void> => {
    const newConfig = {
      ...configuration,
      share: !configuration.share,
    };
    setConfiguration(newConfig);
    putConfig(newConfig);
  };

  const toggleAdvanced = async (): Promise<void> => {
    const newConfig = {
      ...configuration,
      advanced: {
        ...configuration.advanced,
        enabled: !configuration.advanced.enabled,
      },
    };
    setConfiguration(newConfig);
    putConfig(newConfig);
  };

  const toggleAdvancedFilter = async (filterName: string): Promise<void> => {
    let list = configuration.advanced.list;

    if (list.includes(filterName)) {
      list = list.filter((e) => e !== filterName);
    } else {
      list.push(filterName);
    }

    const newConfig = {
      ...configuration,
      advanced: {
        ...configuration.advanced,
        list: list,
      },
    };

    setConfiguration(newConfig);
    putConfig(newConfig);
  };

  const setFilter = async (filterName: string): Promise<void> => {
    setConfiguration({
      ...configuration,
      filters: {
        ...configuration.filters,
        [filterName]: !configuration.filters[filterName],
      },
    });
    putConfig(configuration);
  };

  const [displaySuccess, setDisplaySuccess] = useState<boolean>(false);
  const [displayError, setDisplayError] = useState<boolean>(false);
  const [canSubmit, setCanSubmit] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [account, setAccount] = useState(AuthService.getAccount());
  const [plainWallet, setPlainWallet] = useState(account?.walletAddress || "");
  const [loggedIn, setLoggedIn] = useState(!!account);
  const [loggingIn, setLoggingIn] = useState(false);
  const countryNames = Object.values(countries);

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

  const showError = (message: string) => {
    setErrorMessage(message);
    setDisplayError(true);

    setTimeout(() => {
      setErrorMessage("");
      setDisplayError(false);
    }, API_MESSAGES_TIME);
  };

  return (
    <Container>
      {loaded ? (
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
                retrieval deals for known CIDs.
              </p>
            </Col>
          </Row>

          <Form>
            <Form.Group>
              <Form.Label>FIL wallet address</Form.Label>
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
                {plainWallet && !loggedIn && (
                  <Col md="auto">
                    <Button
                      disabled={loggingIn}
                      onClick={(e) => {
                        if (!loggingIn) {
                          logIn();
                        }
                      }}
                    >
                      {!loggingIn ? "Login" : "Loading..."}
                    </Button>
                  </Col>
                )}
              </Row>
            </Form.Group>
            {account && (
              <>
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
              </>
            )}
            {account && (
              <Row>
                <Col>
                  <Button
                    variant="primary"
                    type="button"
                    disabled={!canSubmit}
                    onClick={(ev: MouseEvent<HTMLElement>) => {
                      ev.preventDefault();

                      // validations here
                      if (
                        account?.email &&
                        !validator.isEmail(account?.email)
                      ) {
                        showError("Email is not valid");
                        return;
                      }

                      if (
                        account?.website &&
                        !validator.isURL(account?.website)
                      ) {
                        showError("Website is not a valid URL");
                        return;
                      }

                      setCanSubmit(false);
                      ApiService.updateProvider(account).then(() => {
                        setCanSubmit(true);
                        setDisplaySuccess(true);

                        setLoaded(false);

                        setTimeout(() => {
                          setDisplaySuccess(false);
                        }, API_MESSAGES_TIME);
                      });
                    }}
                  >
                    Update account info
                  </Button>
                </Col>
                <Col md="auto">
                  <Button onClick={() => setAccount(null)}>Log out</Button>
                </Col>
              </Row>
            )}
            {displaySuccess && (
              <span style={{ color: "green", marginLeft: 8 }}>
                Successfully updated contact info
              </span>
            )}
            {displayError && (
              <span style={{ color: "red", marginLeft: 8 }}>
                {errorMessage}
              </span>
            )}
          </Form>

          {configuration.bitscreen ? (
            <>
              <Row className={"settings-block"}>
                <Col>
                  <h4>Filter CIDs</h4>
                  <FormGroup controlId={"external"}>
                    <FormCheck
                      checked={configuration.filters.external}
                      onChange={(evt: FormEvent<HTMLDivElement>) =>
                        setFilter("external")
                      }
                      type="checkbox"
                      label="blocked by any node"
                    />
                  </FormGroup>
                  <FormGroup controlId={"internal"}>
                    <FormCheck
                      checked={configuration.filters.internal}
                      onChange={(evt: FormEvent<HTMLDivElement>) =>
                        setFilter("internal")
                      }
                      type="checkbox"
                      label="on my custom lists"
                    />
                  </FormGroup>
                </Col>
              </Row>

              <Row className={"settings-block"}>
                <Col>
                  <FormCheck
                    type="switch"
                    id="share-lists"
                    label="Share contents of my filter lists with other nodes"
                    checked={configuration.share}
                    onChange={() => toggleShare()}
                  />
                  <p className="text-dim">
                    (Private lists will not be affected)
                  </p>
                </Col>
              </Row>

              <Row className={"settings-block"}>
                <Col>
                  <FormCheck
                    type="switch"
                    id="enhanced-filtering"
                    label="Use enhanced filtering"
                    checked={configuration.advanced.enabled}
                    onChange={() => toggleAdvanced()}
                  />
                  <p className="text-dim">
                    BitScreen can auto-filter hashes found in third party
                    databases
                  </p>

                  {configuration.advanced.enabled ? (
                    <>
                      <FormCheck
                        type="checkbox"
                        label="Audible Magic (Copyrighted Music)"
                        checked={configuration.advanced.list.includes(
                          "audibleMagic"
                        )}
                        onChange={() => toggleAdvancedFilter("audibleMagic")}
                      />

                      <FormCheck
                        type="checkbox"
                        label="PhotoDNA (CSAM)"
                        checked={configuration.advanced.list.includes(
                          "photoDNA"
                        )}
                        onChange={() => toggleAdvancedFilter("photoDNA")}
                      />

                      <FormCheck
                        type="checkbox"
                        label="GIFCT (Terrorist Content)"
                        checked={configuration.advanced.list.includes("GIFCT")}
                        onChange={() => toggleAdvancedFilter("GIFCT")}
                      />
                    </>
                  ) : null}
                </Col>
              </Row>
            </>
          ) : null}
        </>
      ) : null}
    </Container>
  );
}

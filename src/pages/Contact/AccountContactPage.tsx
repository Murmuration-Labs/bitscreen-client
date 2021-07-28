import { countries } from "countries-list";
import React, { ChangeEvent, MouseEvent, useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import PuffLoader from "react-spinners/PuffLoader";
import validator from "validator";
import ApiService from "../../services/ApiService";
import * as AuthService from "../../services/AuthService";
import { Account } from "./Interfaces";

const API_MESSAGES_TIME = 1500;

export default function AccountContactPage(): JSX.Element {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [canSubmit, setCanSubmit] = useState<boolean>(true);
  const [displaySuccess, setDisplaySuccess] = useState<boolean>(false);
  const [displayError, setDisplayError] = useState<boolean>(false);
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

  const showError = (message: string) => {
    setErrorMessage(message);
    setDisplayError(true);

    setTimeout(() => {
      setErrorMessage("");
      setDisplayError(false);
    }, API_MESSAGES_TIME);
  };

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
            console.log("Error");

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

  const countryNames = Object.values(countries);

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

  const renderFormOrLoader = (): JSX.Element => {
    if (!loaded) {
      return (
        <div>
          <Row style={{ justifyContent: "center" }}>
            <PuffLoader color={"#ffc107"} loading={true} size={200} />
          </Row>
          <Row style={{ justifyContent: "center" }}>
            <span>Fetching account info..</span>
          </Row>
        </div>
      );
    }

    return (
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
                  if (account?.email && !validator.isEmail(account?.email)) {
                    showError("Email is not valid");
                    return;
                  }

                  if (account?.website && !validator.isURL(account?.website)) {
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
          <span style={{ color: "red", marginLeft: 8 }}>{errorMessage}</span>
        )}
      </Form>
    );
  };

  return (
    <>
      <Container>
        <Row>
          <Col>
            <h2>Account contact info</h2>
          </Col>
        </Row>
        <Row>
          <Col>{renderFormOrLoader()}</Col>
        </Row>
      </Container>
    </>
  );
}

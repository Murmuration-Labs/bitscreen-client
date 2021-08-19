import React, { ChangeEvent, useEffect, useState } from "react";
import { Button, Col, Container, Form, Row } from "react-bootstrap";
import PuffLoader from "react-spinners/PuffLoader";
import ApiService from "../../services/ApiService";
import * as AuthService from "../../services/AuthService";

export default function AccountContactPage(): JSX.Element {
  const [loaded, setLoaded] = useState<boolean>(false);
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
                onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
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
        <span style={{ color: "red", marginLeft: 8 }}>{errorMessage}</span>
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

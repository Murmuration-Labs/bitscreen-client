import React, { ChangeEvent, useEffect, useState, MouseEvent } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import PuffLoader from "react-spinners/PuffLoader";
import { Account } from "./Interfaces";
import ContactService from "../../services/ContactService";
import ApiService from "../../services/ApiService";
import { Typeahead } from "react-bootstrap-typeahead";
import { countries } from "countries-list";
import validator from "validator";

const API_MESSAGES_TIME = 1500;

export default function AccountContactPage(): JSX.Element {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [canSubmit, setCanSubmit] = useState<boolean>(true);
  const [displaySuccess, setDisplaySuccess] = useState<boolean>(false);
  const [displayError, setDisplayError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const showError = (message: string) => {
    setErrorMessage(message);
    setDisplayError(true);

    setTimeout(() => {
      setErrorMessage("");
      setDisplayError(false);
    }, API_MESSAGES_TIME);
  };

  const [account, setAccount] = useState<Account>(
    ContactService.emptyAccount()
  );

  const fetchAccount = async (): Promise<void> => {
    if (!loaded) {
      const loadedAccount: Account = await ApiService.getProviderInfo();
      setAccount(loadedAccount);
      setLoaded(true);
    }
  };

  useEffect(() => {
    void fetchAccount();
  }, []);

  const handleFieldChange = (
    key: string,
    ev: ChangeEvent<HTMLInputElement>
  ) => {
    account[key] = ev.target.value;
    setAccount({
      ...account,
    });
  };

  const countryNames = Object.values(countries);

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
          <Form.Control
            type="text"
            placeholder="FIL address"
            value={account.fileCoinAddress}
            onChange={(ev: ChangeEvent<HTMLInputElement>) =>
              handleFieldChange("fileCoinAddress", ev)
            }
          />
        </Form.Group>
        <Form.Group>
          <Form.Label>Business name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Business name"
            value={account.businessName}
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
            value={account.website}
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
            value={account.email}
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
            value={account.contactPerson}
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
            value={account.address}
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

        <Button
          variant="primary"
          type="button"
          disabled={!canSubmit}
          onClick={(ev: MouseEvent<HTMLElement>) => {
            ev.preventDefault();

            // validations here
            if (account.email !== "" && !validator.isEmail(account.email)) {
              showError("Email is not valid");
              return;
            }

            if (account.website !== "" && !validator.isURL(account.website)) {
              showError("Website is not a valid URL");
              return;
            }

            setCanSubmit(false);
            ApiService.updateProviderInfo(account).then(() => {
              setCanSubmit(true);
              setDisplaySuccess(true);

              setTimeout(() => {
                setDisplaySuccess(false);
              }, API_MESSAGES_TIME);
            });
          }}
        >
          Update account info
        </Button>
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

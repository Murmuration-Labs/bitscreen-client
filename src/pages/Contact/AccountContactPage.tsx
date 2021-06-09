import React, { ChangeEvent, useEffect, useState, MouseEvent } from "react";
import { Container, Row, Col, Form, Button } from "react-bootstrap";
import PuffLoader from "react-spinners/PuffLoader";
import { Account } from "./Interfaces";
import ContactService from "../../services/ContactService";
import ApiService from "../../services/ApiService";

export default function AccountContactPage(): JSX.Element {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [canSubmit, setCanSubmit] = useState<boolean>(true);
  const [displaySuccess, setDisplaySuccess] = useState<boolean>(false);

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
          <Form.Control
            type="text"
            placeholder="Country"
            value={account.country}
            onChange={(ev: ChangeEvent<HTMLInputElement>) =>
              handleFieldChange("country", ev)
            }
          />
        </Form.Group>
        <Button
          variant="primary"
          type="button"
          disabled={!canSubmit}
          onClick={(ev: MouseEvent<HTMLElement>) => {
            ev.preventDefault();

            // validations here

            setCanSubmit(false);
            ApiService.updateProviderInfo(account).then(() => {
              setCanSubmit(true);
              setDisplaySuccess(true);

              setTimeout(() => {
                setDisplaySuccess(false);
              }, 1500);
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

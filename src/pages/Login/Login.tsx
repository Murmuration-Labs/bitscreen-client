import _ from "lodash";
import React, { useEffect, useState } from "react";
import { Button, Col, Container, Form, FormCheck, Row } from "react-bootstrap";
import "./Login.css";
import LoggerService from "services/LoggerService";
import { metamaskIcon } from "resources/icons/index";

export default function Login(props) {
  const { connectMetamask, previousPath, setPreviousPath } = props;

  useEffect(() => LoggerService.info("Loading Login page."), []);

  useEffect(() => {
    if (previousPath) {
      setPreviousPath((currentPath) => {
        if (!currentPath) {
          return previousPath;
        } else {
          return currentPath;
        }
      });
    }
  }, [previousPath]);

  return (
    <>
      <Row
        className="mx-0"
        style={{
          paddingTop: 20,
          paddingBottom: 20,
        }}
      >
        <Col className="pl-0">
          <div className="ml-3">
            <Row>
              <Col>
                <Form.Label className="h4">
                  <strong>Connect your wallet</strong>
                </Form.Label>
              </Col>
            </Row>
          </div>
          <div className="ml-3">
            <Row>
              <Col>
                <p className="login-subtitle">
                  Connect with one of our available wallets to use BitScreen
                </p>
              </Col>
            </Row>
          </div>
          <div className="ml-3">
            <Row>
              <Col>
                <div className="wallet-table">
                  <div
                    id="metamask-row"
                    onClick={connectMetamask}
                    className="d-flex justify-content-between align-items-center wallet-row w-100 p-3"
                  >
                    <div className="d-flex align-items-center">
                      <div className="wallet-avatar mr-2">
                        <img width={35} src={metamaskIcon}></img>
                      </div>
                      <div className="wallet-name">MetaMask</div>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </div>
          <div className="mt-4 ml-3">
            <Row>
              <Col>
                <p className="login-subtitle">
                  By using BitScreen, you agree to our{" "}
                  <a
                    href="https://github.com/Murmuration-Labs/bitscreen/blob/master/terms_of_service.md"
                    target="_blank"
                  >
                    Terms
                  </a>{" "}
                  & {` `}
                  <a
                    href="https://github.com/Murmuration-Labs/bitscreen/blob/master/privacy_policy.md"
                    target="_blank"
                  >
                    Privacy Policy
                  </a>
                  {"."}
                </p>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </>
  );
}

import {
  faCog,
  faQuestionCircle,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { Col, NavDropdown, Row } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import * as AuthService from "../../services/AuthService";
import "./Navigation.css";
import Bitscreenlogo from "./bitscreen-logo.png";

function Navigation(): JSX.Element {
  const [provider, setProvider] = useState(AuthService.getAccount());

  useEffect(() => AuthService.subscribe(setProvider), []);

  const shortenAddress = (address: string): string => {
    return address.length > 8
      ? address.substr(0, 4) + "..." + address.substr(-4)
      : address;
  };

  return (
    <nav className="container navbar mw-100">
      <Row className="h-100">
        <Col
          className="d-flex align-items-center justify-content-center px-0"
          xs={2}
        >
          <NavLink className="nav-logo d-flex justify-content-center" to="/">
            <img src={Bitscreenlogo} height="48px"></img>
          </NavLink>
        </Col>
        <Col className="d-flex align-items-end nav-container px-0" xs={10}>
          {provider && (
            <NavLink
              className="nav-link"
              activeClassName={"is-active"}
              to="/dashboard"
            >
              Dashboard
            </NavLink>
          )}
          {provider && (
            <NavLink
              className="nav-link"
              activeClassName={"is-active"}
              to="/settings"
            >
              Settings
            </NavLink>
          )}
          {provider && (
            <NavLink
              className="nav-link"
              activeClassName={"is-active"}
              to="/filters"
            >
              My Filters
            </NavLink>
          )}
          {provider && (
            <NavLink
              className="nav-link"
              activeClassName={"is-active"}
              to="/directory"
            >
              Directory
            </NavLink>
          )}
          {provider && (
            <div className="nav-item-container">
              <a className="mr-4" href="/">
                <FontAwesomeIcon
                  color="white"
                  size="lg"
                  icon={faQuestionCircle}
                />
              </a>
              <a className="mr-4" href="/settings">
                <FontAwesomeIcon color="white" size="lg" icon={faCog} />
              </a>
              <NavDropdown
                id="nav-dropdown-wallet-address"
                title={
                  <span>
                    <FontAwesomeIcon size="sm" icon={faUser} />{" "}
                    {shortenAddress(provider.walletAddressHashed ?? "")}
                  </span>
                }
              >
                <NavDropdown.Item
                  onClick={() => {
                    AuthService.removeAccount();
                  }}
                >
                  Disconnect wallet?
                </NavDropdown.Item>
              </NavDropdown>
            </div>
          )}
        </Col>
        {/* <Col className="d-flex align-items-center" xs={4}>
          
        </Col> */}
      </Row>
      {/* <Row>
        <Col xs={0} sm={2} />
        <Col xs={12} sm={10}>
          
        </Col>
      </Row> */}
    </nav>
  );
}

export default Navigation;

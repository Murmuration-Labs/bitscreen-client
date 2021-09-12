import {
  faCog,
  faFile,
  faFolderOpen,
  faSearch,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { Col, NavDropdown, Row } from "react-bootstrap";
import { NavLink } from "react-router-dom";
import * as AuthService from "../../services/AuthService";
import "./Navigation.css";

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
      <Row>
        <Col xs={8}>
          <NavLink className="nav-logo" to="/">
            <FontAwesomeIcon icon={faSearch} /> BitScreen
          </NavLink>
        </Col>
        <Col className="d-flex align-items-center" xs={4}>
          {provider && (
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
          )}
        </Col>
      </Row>
      <Row>
        <Col xs={0} sm={2} />
        <Col xs={12} sm={10}>
          <div className="nav-container">
            {provider && (
              <NavLink
                className="nav-link"
                activeClassName={"is-active"}
                to="/dashboard"
              >
                <FontAwesomeIcon size="sm" icon={faCog} /> Dashboard
              </NavLink>
            )}
            {provider && (
              <NavLink
                className="nav-link"
                activeClassName={"is-active"}
                to="/settings"
              >
                <FontAwesomeIcon size="sm" icon={faCog} /> Settings
              </NavLink>
            )}
            {provider && (
              <NavLink
                className="nav-link"
                activeClassName={"is-active"}
                to="/filters"
              >
                <FontAwesomeIcon size="sm" icon={faFile} /> Filters
              </NavLink>
            )}
            {provider && (
              <NavLink
                className="nav-link"
                activeClassName={"is-active"}
                to="/directory"
              >
                <FontAwesomeIcon size="sm" icon={faFolderOpen} /> Public Filters
              </NavLink>
            )}
          </div>
        </Col>
      </Row>
    </nav>
  );
}

export default Navigation;

import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { NavDropdown } from "react-bootstrap";
import * as AuthService from "../../services/AuthService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faFile,
  faFolderOpen,
  faSearch,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import "./Navigation.css";

function Navigation(): JSX.Element {
  const [provider, setProvider] = useState(AuthService.getAccount());

  useEffect(() => {
    const unsubscribe = AuthService.subscribe((acc) => setProvider(acc));
    return () => {
      unsubscribe();
    };
  }, []);

  const shortenAddress = (address: string): string => {
    return address.length > 8
      ? address.substr(0, 4) + "..." + address.substr(-4)
      : address;
  };

  return (
    <nav className="navbar">
      <NavLink className="nav-logo" to="/">
        <FontAwesomeIcon icon={faSearch} /> BitScreen
      </NavLink>
      <div style={{ flexGrow: 1 }} />
      <div className="nav-container">
        <NavLink
          className="nav-link"
          activeClassName={"is-active"}
          to="/settings"
        >
          <FontAwesomeIcon size="sm" icon={faCog} /> Settings
        </NavLink>
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
              href="/settings"
              onClick={() => {
                setProvider(null);
                AuthService.removeAccount();
              }}
            >
              Disconnect wallet?
            </NavDropdown.Item>
          </NavDropdown>
        )}
      </div>
      <div style={{ flexGrow: 1 }} />
    </nav>
  );
}

export default Navigation;

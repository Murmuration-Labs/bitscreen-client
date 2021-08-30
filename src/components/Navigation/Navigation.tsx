import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import * as AuthService from "../../services/AuthService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faFile,
  faFolder,
  faSearch,
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

  return (
    <nav className="navbar">
      <div className="nav-container">
        <NavLink className="nav-logo" to="/">
          <FontAwesomeIcon icon={faSearch} /> BitScreen
        </NavLink>
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
            <FontAwesomeIcon size="sm" icon={faFolder} /> Directory
          </NavLink>
        )}
      </div>
    </nav>
  );
}

export default Navigation;

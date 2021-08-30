import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import * as AuthService from "../../services/AuthService";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
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
    <nav>
      <NavLink className="nav-link" to="/">
        <FontAwesomeIcon icon={faSearch} /> Bit<strong>Screen</strong>
      </NavLink>
      <NavLink
        className="nav-link"
        activeClassName={"is-active"}
        to="/settings"
      >
        Settings
      </NavLink>
      {provider && (
        <NavLink
          className="nav-link"
          activeClassName={"is-active"}
          to="/filters"
        >
          Filters
        </NavLink>
      )}
      {provider && (
        <NavLink
          className="nav-link"
          activeClassName={"is-active"}
          to="/directory"
        >
          ⤷&nbsp;Directory
        </NavLink>
      )}
    </nav>
  );
}

export default Navigation;

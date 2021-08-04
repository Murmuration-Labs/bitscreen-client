import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import * as AuthService from "../../services/AuthService";
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
      <NavLink className="nav-link" activeClassName={"is-active"} to="/account">
        Account
      </NavLink>
    </nav>
  );
}

export default Navigation;

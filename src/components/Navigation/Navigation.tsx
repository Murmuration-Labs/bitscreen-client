import React from "react";
import { NavLink } from "react-router-dom";
import "./Navigation.css";

function Navigation(): JSX.Element {
  return (
    <nav>
      <NavLink
        className="nav-link"
        activeClassName={"is-active"}
        to="/settings"
      >
        Settings
      </NavLink>
      <NavLink className="nav-link" activeClassName={"is-active"} to="/filters">
        Filters
      </NavLink>
      <NavLink className="nav-link" activeClassName={"is-active"} to="/account">
        Account
      </NavLink>
    </nav>
  );
}

export default Navigation;

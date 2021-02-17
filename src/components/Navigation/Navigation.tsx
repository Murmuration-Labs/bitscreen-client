import React from "react"
import { NavLink } from "react-router-dom"
import "./Navigation.css"

function Navigation() {
  return (
    <nav>
      <NavLink className="nav-link"
               activeClassName={"is-active"} to="/settings">Settings</NavLink>
      <NavLink className="nav-link"
               activeClassName={"is-active"} to="/filters">Filters</NavLink>
    </nav>
  );
}

export default Navigation

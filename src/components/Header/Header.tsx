import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react"
import "./Headers.css"
import { faSearch } from '@fortawesome/free-solid-svg-icons'

function Header() {
  return (
    <header>
      <FontAwesomeIcon icon={faSearch}/> Bit<strong>Screen</strong>
    </header>
  );
}

export default Header

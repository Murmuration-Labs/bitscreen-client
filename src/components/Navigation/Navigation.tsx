import {
  faCog,
  faQuestionCircle,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import {
  Col,
  NavDropdown,
  OverlayTrigger,
  Row,
  Tooltip,
} from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import * as AuthService from 'services/AuthService';
import './Navigation.css';
import Bitscreenlogo from './bitscreen-logo.png';
import { LoginType } from 'types/interfaces';

function Navigation(props): JSX.Element {
  const { provider, appLogout, googleLogout } = props;
  const shortenAddress = (address: string): string => {
    return address.length > 8
      ? address.substr(0, 4) + '...' + address.substr(-4)
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
              activeClassName={'is-active'}
              to="/dashboard"
            >
              Dashboard
            </NavLink>
          )}
          {provider && (
            <NavLink
              className="nav-link"
              activeClassName={'is-active'}
              to="/filters"
            >
              My Filters
            </NavLink>
          )}
          {provider && (
            <NavLink
              className="nav-link"
              activeClassName={'is-active'}
              to="/directory"
            >
              Directory
            </NavLink>
          )}
          {provider && (
            <div className="nav-item-container">
              <OverlayTrigger
                placement="bottom"
                delay={{ show: 150, hide: 300 }}
                overlay={
                  <Tooltip id="help-tooltip">
                    https://github.com/Murmuration-Labs/bitscreen
                  </Tooltip>
                }
              >
                <a
                  className="mr-4"
                  target="_blank"
                  href="https://github.com/Murmuration-Labs/bitscreen"
                >
                  <FontAwesomeIcon
                    color="white"
                    size="lg"
                    icon={faQuestionCircle}
                  />
                </a>
              </OverlayTrigger>
              <NavLink
                className="mr-4 icon-nav-link"
                to="/settings"
                activeClassName={'is-active'}
              >
                <FontAwesomeIcon color="white" size="lg" icon={faCog} />
              </NavLink>
              <NavDropdown
                id="nav-dropdown-wallet-address"
                title={
                  <span>
                    <FontAwesomeIcon size="sm" icon={faUser} />{' '}
                    {shortenAddress(
                      provider.walletAddress || provider.loginEmail || ''
                    )}
                  </span>
                }
              >
                <NavDropdown.Item
                  onClick={() => {
                    AuthService.getLoginType() === LoginType.Wallet
                      ? appLogout()
                      : googleLogout();
                  }}
                >
                  Log out?
                </NavDropdown.Item>
              </NavDropdown>
            </div>
          )}
        </Col>
      </Row>
    </nav>
  );
}

export default Navigation;

import React, { useEffect, useState } from "react";
import { Col, Container, Row } from "react-bootstrap";
import "react-bootstrap-typeahead/css/Typeahead.css";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  RouteComponentProps,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navigation from "../components/Navigation/Navigation";
import MetamaskProvider from "../providers/MetamaskProvider";
import * as AuthService from "../services/AuthService";
import "./App.css";
import Dashboard from "./Dashboard/Dashboard";
import FilterPage from "./Filters/FilterPage";
import Filters from "./Filters/Filters";
import PublicFilterDetailsPage from "./Public/PublicFilterDetails/PublicFilterDetails";
import PublicFilters from "./Public/PublicFilters";
import Settings from "./Settings/Settings";
interface MatchParams {
  id: string;
}

export type RouterProps = RouteComponentProps<MatchParams>;

const PrivateRoute = ({
  comp: Component, // use comp prop
  auth: provider,
  ...rest
}) => (
  <Route
    {...rest}
    render={(props) =>
      !provider || !provider.accessToken ? (
        <Redirect to="/settings" />
      ) : (
        <Component {...props} />
      )
    }
  />
);

function App(): JSX.Element {
  const [provider, setProvider] = useState(AuthService.getAccount());

  useEffect(() => AuthService.subscribe(setProvider), []);

  return (
    <MetamaskProvider>
      <Router>
        <Navigation />
        <Container fluid={true}>
          <Row className="fill-height">
            <Col className={"stage"}>
              <Route exact path="/">
                <Redirect to="/settings" />
              </Route>
              <Route path="/settings" exact component={Settings} />
              <PrivateRoute
                path="/dashboard"
                exact
                comp={Dashboard}
                auth={provider}
              />
              <PrivateRoute
                path="/filters"
                exact
                comp={Filters}
                auth={provider}
              />
              <PrivateRoute
                path="/filters/edit/:shareId?"
                exact
                comp={FilterPage}
                auth={provider}
              />
              <PrivateRoute
                path="/filters/new"
                exact
                comp={FilterPage}
                auth={provider}
              />
              <PrivateRoute
                path="/directory"
                exact
                comp={PublicFilters}
                auth={provider}
              />
              <PrivateRoute
                path="/directory/details/:shareId?"
                exact
                comp={PublicFilterDetailsPage}
                auth={provider}
              />
            </Col>
          </Row>
          <ToastContainer />
        </Container>
      </Router>
    </MetamaskProvider>
  );
}

export default App;

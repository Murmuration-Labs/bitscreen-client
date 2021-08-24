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
import Header from "../components/Header/Header";
import Navigation from "../components/Navigation/Navigation";
import "./App.css";
import FilterPage from "./Filters/FilterPage";
import Filters from "./Filters/Filters";
import PublicFilters from "./Public/PublicFilters";
import Settings from "./Settings/Settings";
import * as AuthService from "../services/AuthService";
import FilterDetailsPage from "./Public/FilterDetailsPage";

interface MatchParams {
  id: string;
}

export type RouterProps = RouteComponentProps<MatchParams>;

function App(): JSX.Element {
  const [provider, setProvider] = useState(AuthService.getAccount());

  useEffect(() => {
    const unsubscribe = AuthService.subscribe((acc) => setProvider(acc));
    return () => {
      unsubscribe();
    };
  }, []);

  const authHandler = (transition) => {
    console.log(transition);
  };

  return (
    <Router>
      <Header />
      <Container fluid={true}>
        <Row className="fill-height">
          <Col md={2} sm={3} className="left-bar fill-height">
            <Navigation />
          </Col>
          <Col md={10} sm={9} className={"stage"}>
            <Route
              path="/filters"
              exact
              component={provider ? Filters : Settings}
            >
              {!provider && <Redirect to="/settings" />}
            </Route>
            <Route
              path="/filters/edit/:id?"
              exact
              component={provider ? FilterPage : Settings}
            >
              {!provider && <Redirect to="/settings" />}
            </Route>
            <Route
              path="/filters/new"
              exact
              component={provider ? FilterPage : Settings}
            >
              {!provider && <Redirect to="/settings" />}
            </Route>
            <Route path="/settings" exact component={Settings} />
            <Route
              path="/directory"
              exact
              component={provider ? PublicFilters : Settings}
            >
              {!provider && <Redirect to="/settings" />}
            </Route>
            <Route
              path="/directory/details/:shareId?"
              exact
              component={provider ? FilterDetailsPage : Settings}
            >
              {!provider && <Redirect to="/settings" />}
            </Route>
            <Route exact path="/">
              <Redirect to="/settings" />
            </Route>
          </Col>
        </Row>
        <ToastContainer />
      </Container>
    </Router>
  );
}

export default App;

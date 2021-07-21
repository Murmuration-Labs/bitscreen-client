import React from "react";
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
import AccountContactPage from "./Contact/AccountContactPage";
import FilterPage from "./Filters/FilterPage";
import Filters from "./Filters/Filters";
import PublicFilters from "./Public/PublicFilters";
import Settings from "./Settings/Settings";

interface MatchParams {
  id: string;
}

export type RouterProps = RouteComponentProps<MatchParams>;

function App(): JSX.Element {
  return (
    <Router>
      <Header />
      <Container fluid={true}>
        <Row className="fill-height">
          <Col md={2} sm={3} className="left-bar fill-height">
            <Navigation />
          </Col>
          <Col md={10} sm={9} className={"stage"}>
            <Route path="/settings" exact component={Settings} />
            <Route path="/filters" exact component={Filters} />
            <Route path="/filters/edit/:id?" exact component={FilterPage} />
            <Route path="/filters/new" exact component={FilterPage} />
            <Route path="/account" exact component={AccountContactPage} />
            <Route path="/public" exact component={PublicFilters} />
            <Route exact path="/">
              <Redirect to="/account" />
            </Route>
          </Col>
        </Row>
        <ToastContainer />
      </Container>
    </Router>
  );
}

export default App;

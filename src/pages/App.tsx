import React from "react";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  RouteComponentProps,
} from "react-router-dom";
import Settings from "./Settings/Settings";
import Filters from "./Filters/Filters";
import Header from "../components/Header/Header";
import Navigation from "../components/Navigation/Navigation";
import { Col, Container, Row } from "react-bootstrap";
import "./App.css";
import FilterPage from "./Filters/FilterPage";

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
            <Route path="/filters/add/:id" exact component={FilterPage} />
            <Route path="/filters/edit/:id" exact component={FilterPage} />
            {/*<Route path="/filters/import" exact component={FilterPage} />*/}
            <Route exact path="/">
              <Redirect to="/settings" />
            </Route>
          </Col>
        </Row>
      </Container>
    </Router>
  );
}

export default App;

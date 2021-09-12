import React, { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import ApiService from "../../services/ApiService";
import { Config, DashboardData } from "../Filters/Interfaces";
import {
  DashboardCard,
  DashboardDoubleCard,
} from "./DashboardCards/DashboardCard";

function Dashboard(): JSX.Element {
  const [dataCount, setDataCount] = React.useState<number>(0);
  const [configuration, setConfiguration] = useState<Config>({
    bitscreen: false,
    import: false,
    share: false,
  });
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    currentlyFiltering: 0,
    listSubscribers: 0,
    dealsDeclined: 0,
    activeLists: 0,
    inactiveLists: 0,
    importedLists: 0,
    privateLists: 0,
    publicLists: 0,
  });

  useEffect(() => {
    ApiService.getDashboardInformation().then((dashboardData) => {
      setDashboardData(dashboardData);
    });

    ApiService.getProviderConfig().then((config: Config) =>
      setConfiguration(config)
    );
  }, []);

  return (
    <>
      <Row className="mb-3">
        <Col sm={12} md={4} xl={4}>
          <DashboardCard
            cardTitle="Currently Filtering CIDs"
            cardText={dashboardData.currentlyFiltering}
          />
        </Col>
        <Col sm={12} md={4} xl={4}>
          <DashboardCard
            cardTitle="List Subscribers"
            cardText={dashboardData.listSubscribers}
          />
        </Col>
        <Col sm={12} md={4} xl={4}>
          <DashboardCard
            cardTitle="Deals Declined"
            cardText={dashboardData.dealsDeclined}
          />
        </Col>
      </Row>
      <Row className="mb-3">
        <Col xs={12} md={4} xl={5}>
          <DashboardDoubleCard
            cardTitleLeft="Active lists"
            cardTextLeft={dashboardData.activeLists}
            cardTitleRight="Inactive lists"
            cardTextRight={dashboardData.inactiveLists}
          />
        </Col>
        <Col xs={12} md={4} xl={2}>
          <DashboardCard
            cardTitle="Imported lists"
            cardText={dashboardData.importedLists}
          />
        </Col>
        <Col xs={12} md={4} xl={5}>
          <DashboardDoubleCard
            cardTitleLeft="Private lists"
            cardTextLeft={dashboardData.privateLists}
            cardTitleRight="Public lists"
            cardTextRight={dashboardData.publicLists}
          />
        </Col>
      </Row>
    </>
  );
}

export default Dashboard;

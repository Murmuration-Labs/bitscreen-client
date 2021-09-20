import React, { useEffect, useState } from "react";
import { Col, Row } from "react-bootstrap";
import ApiService from "../../services/ApiService";
import {
  ChartDataEntry,
  Config,
  DashboardData,
  PeriodInterval,
  PeriodType,
} from "../Filters/Interfaces";
import {
  DashboardCard,
  DashboardDoubleCard,
} from "../../components/Cards/Cards";
import { DashboardChart } from "./DashboardChart/DashboardChart";
import { CardContent, Typography } from "@material-ui/core";
import Card from "@material-ui/core/Card";
import { Form } from "react-bootstrap";
import { PeriodRange } from "./DatePicker/DatePicker";
import moment from "moment";

function Dashboard(): JSX.Element {
  const [periodType, setPeriodType] = useState<PeriodType>(PeriodType.daily);
  const [periodInterval, setPeriodInterval] = useState<PeriodInterval>({
    startDate: null,
    endDate: null,
  });

  const [configuration, setConfiguration] = useState<Config>({
    bitscreen: false,
    import: false,
    share: false,
  });

  const [chartData, setChartData] = useState<ChartDataEntry[]>([]);
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
    ApiService.getDashboardData().then((dashboardData) => {
      setDashboardData(dashboardData);
    });

    ApiService.getProviderConfig().then((config: Config) =>
      setConfiguration(config)
    );
  }, []);

  useEffect(() => {
    if (!periodInterval.startDate || !periodInterval.endDate) {
      setChartData([]);
      return;
    }

    const stringPeriodInterval = {
      startDate: moment(periodInterval.startDate).format("YYYY-MM-DD"),
      endDate: moment(periodInterval.endDate).format("YYYY-MM-DD"),
    };

    ApiService.getChartData(periodType, stringPeriodInterval).then(
      (chartInformation) => setChartData(chartInformation)
    );
  }, [periodInterval]);

  const handlePeriodPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPeriodInterval({
      startDate: null,
      endDate: null,
    });
    setPeriodType(e.target.value as PeriodType);
  };

  const dashboardChartRender = () => {
    if (chartData.length) {
      return <DashboardChart chartData={chartData} />;
    }

    if (periodInterval.startDate && periodInterval.endDate) {
      return (
        <h2 className="w-100 d-flex justify-content-center align-items-center font-weight-bold py-5">
          NO CHART DATA
        </h2>
      );
    }

    return (
      <h4 className="w-100 d-flex justify-content-center align-items-center font-weight-bold py-5">
        PLEASE SELECT A PERIOD TYPE AND INTERVAL
      </h4>
    );
  };

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
      <Card className="root" variant="outlined">
        <CardContent>
          <div className="chart-head-container">
            <Typography className="card-title">Chart</Typography>
            <div className="chart-head-container">
              <Form.Control
                as="select"
                value={periodType}
                className="chart-period-type-picker mr-3"
                onChange={handlePeriodPickerChange}
              >
                <option value={PeriodType.daily}>Daily</option>
                <option value={PeriodType.monthly}>Monthly</option>
                <option value={PeriodType.yearly}>Yearly</option>
              </Form.Control>
              <PeriodRange
                periodType={periodType}
                periodInterval={periodInterval}
                setPeriodInterval={setPeriodInterval}
              ></PeriodRange>
            </div>
          </div>
          {dashboardChartRender()}
        </CardContent>
      </Card>
    </>
  );
}

export default Dashboard;

import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import React from "react";
import "./DashboardCard.css";

export function DashboardCard(props) {
  const { cardTitle, cardText } = props;

  return (
    <Card className="root" variant="outlined">
      <CardContent>
        <Typography className="card-title">{cardTitle}</Typography>
        <Typography className="card-text">{cardText}</Typography>
      </CardContent>
    </Card>
  );
}

export function DashboardDoubleCard(props) {
  const { cardTitleLeft, cardTextLeft, cardTitleRight, cardTextRight } = props;

  return (
    <div className="double-card">
      <Card className="root-double-left" variant="outlined">
        <CardContent>
          <Typography className="card-title">{cardTitleLeft}</Typography>
          <Typography className="card-text">{cardTextLeft}</Typography>
        </CardContent>
      </Card>
      <Card className="root-double-right" variant="outlined">
        <CardContent>
          <Typography className="card-title">{cardTitleRight}</Typography>
          <Typography className="card-text">{cardTextRight}</Typography>
        </CardContent>
      </Card>
    </div>
  );
}

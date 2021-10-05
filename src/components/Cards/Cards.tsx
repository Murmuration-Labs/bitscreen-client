import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import React from "react";
import { Col, Row } from "react-bootstrap";
import "./Cards.css";

export function DashboardCard(props) {
  const { cardTitle, cardText, smallText } = props;

  return (
    <Card className="root" variant="outlined">
      <CardContent>
        <Typography className="card-title">{cardTitle}</Typography>
        <Typography
          className={`${smallText ? "small-card-text" : "card-text"}`}
        >
          {cardText}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function DashboardDoubleCard(props) {
  const {
    cardTitleLeft,
    cardTextLeft,
    cardTitleRight,
    cardTextRight,
    smallText,
  } = props;

  return (
    <div className="double-card">
      <Card className="root-double-left" variant="outlined">
        <CardContent>
          <Typography className="card-title">{cardTitleLeft}</Typography>
          <Typography
            className={`${smallText ? "small-card-text" : "card-text"}`}
          >
            {cardTextRight}
          </Typography>
        </CardContent>
      </Card>
      <Card className="root-double-right" variant="outlined">
        <CardContent>
          <Typography className="card-title">{cardTitleRight}</Typography>
          <Typography
            className={`${smallText ? "small-card-text" : "card-text"}`}
          >
            {cardTextRight}
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}

export function PublicFilterDetailsCard(props) {
  const { cardTitle, cardText } = props;

  return (
    <Card className="root" variant="outlined">
      <CardContent>
        <Typography className="public-card-title single">
          {cardTitle}
        </Typography>
        <Typography className="public-card-text single">{cardText}</Typography>
      </CardContent>
    </Card>
  );
}

export function PublicFilterDetailsDoubleCard(props) {
  const {
    cardTitleLeft,
    cardTextLeft,
    cardTextLeftIsLink,
    cardTitleRight,
    cardTextRight,
    cardTextRightIsLink,
  } = props;

  return (
    <div className="public-double-card">
      <Card className="root public-double" variant="outlined">
        <Col xs={6} className="p-0">
          <CardContent>
            <Typography className="public-card-title double">
              {cardTitleLeft}
            </Typography>
            <Typography className="public-card-text double">
              {cardTextLeftIsLink ? (
                <a
                  style={{ textDecoration: "underline", color: "#003bdd" }}
                  href={cardTextLeft}
                >
                  {cardTextLeft}
                </a>
              ) : (
                cardTextLeft
              )}
            </Typography>
          </CardContent>
        </Col>

        <Col xs={6} className="p-0">
          <CardContent>
            <Typography className="public-card-title double">
              {cardTitleRight}
            </Typography>
            <Typography className="public-card-text double">
              {cardTextRightIsLink ? (
                <a
                  style={{ textDecoration: "underline", color: "#003bdd" }}
                  href={cardTextRight}
                >
                  {cardTextRight}
                </a>
              ) : (
                cardTextRight
              )}
            </Typography>
          </CardContent>
        </Col>
      </Card>
    </div>
  );
}

export function PublicFilterDetailsTripleCard(props) {
  const {
    cardTitleLeft,
    cardTextLeft,
    cardTextLeftIsLink,
    cardTitleCenter,
    cardTextCenter,
    cardTextCenterIsLink,
    cardTitleRight,
    cardTextRight,
    cardTextRightIsLink,
  } = props;

  return (
    <div className="public-triple-card">
      <Card className="root public-triple" variant="outlined">
        <Col xs={4} className="p-0">
          <CardContent>
            <Typography className="public-card-title triple">
              {cardTitleLeft}
            </Typography>
            <Typography className="public-card-text triple">
              {cardTextLeftIsLink ? (
                <a
                  style={{ textDecoration: "underline", color: "#003bdd" }}
                  href={cardTextLeft}
                >
                  {cardTextLeft}
                </a>
              ) : (
                cardTextLeft
              )}
            </Typography>
          </CardContent>
        </Col>
        <Col xs={4} className="p-0">
          <CardContent>
            <Typography className="public-card-title triple">
              {cardTitleCenter}
            </Typography>
            <Typography className="public-card-text triple">
              {cardTextCenterIsLink ? (
                <a
                  style={{ textDecoration: "underline", color: "#003bdd" }}
                  href={cardTextCenter}
                >
                  {cardTextCenter}
                </a>
              ) : (
                cardTextCenter
              )}
            </Typography>
          </CardContent>
        </Col>
        <Col xs={4} className="p-0">
          <CardContent>
            <Typography className="public-card-title triple">
              {cardTitleRight}
            </Typography>
            <Typography className="public-card-text triple">
              {cardTextRightIsLink ? (
                <a
                  style={{ textDecoration: "underline", color: "#003bdd" }}
                  href={cardTextRight}
                >
                  {cardTextRight}
                </a>
              ) : (
                cardTextRight
              )}
            </Typography>
          </CardContent>
        </Col>
      </Card>
    </div>
  );
}

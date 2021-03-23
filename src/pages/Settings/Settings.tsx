import React, { SyntheticEvent } from "react";
import {
  Col,
  Container,
  FormCheck,
  Row,
  ToggleButton,
  ToggleButtonGroup,
} from "react-bootstrap";
import "./Settings.css";

enum Filters {
  Unknown,
  Internal,
  External,
}

type SettingsProps = {};

export default class Settings extends React.Component<SettingsProps, any> {
  state = {
    loaded: false,
    bitscreen: false,
    share: false,
    advanced: false,
    filter: Filters.Unknown,
  };

  async componentDidMount() {
    const config = await fetch(
      "http://localhost:8080/config"
    ).then((response) => response.json());
    console.log("config", config);

    this.setState(
      {
        loaded: true,
        ...config,
      },
      () => this.forceUpdate()
    );
  }

  async toggleBitScreen() {
    this.setState(
      {
        bitscreen: !this.state.bitscreen,
      },
      () => {
        void this.putConfig();
      }
    );
  }

  async toggleShare() {
    this.setState(
      {
        share: !this.state.share,
      },
      () => {
        void this.putConfig();
      }
    );
  }

  async toggleAdvanced() {
    this.setState(
      {
        advanced: !this.state.advanced,
      },
      () => {
        void this.putConfig();
      }
    );
  }

  async setFilter(event: SyntheticEvent) {
    console.log(event);
    this.setState(
      {
        filter: event,
      },
      () => {
        void this.putConfig();
      }
    );
  }

  async putConfig() {
    const config = { ...this.state };

    // @ts-ignore
    delete config.loaded;

    console.log("putting config", config);

    await fetch("http://localhost:8080/config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });

    console.log("config set", config);
  }

  render() {
    return (
      <Container>
        {this.state.loaded ? (
          <>
            <h2>Settings</h2>

            <Row className={"settings-block"}>
              <Col>
                <FormCheck
                  type="switch"
                  id="bitscreen-switch"
                  label="Filter content using BitScreen"
                  checked={this.state.bitscreen}
                  onChange={() => this.toggleBitScreen()}
                />
                <p className="text-dim">
                  Filtering enables a node operator to decline storage and
                  retrieval deals for known CIDs.
                </p>
              </Col>
            </Row>

            {this.state.bitscreen ? (
              <>
                <Row className={"settings-block"}>
                  <Col>
                    <ToggleButtonGroup
                      vertical
                      name={"select-filter"}
                      type="radio"
                      value={this.state.filter}
                      onChange={(evt: SyntheticEvent) => this.setFilter(evt)}
                    >
                      <ToggleButton value={Filters.Internal}>
                        Filter CIDs blocked by any node
                      </ToggleButton>
                      <ToggleButton value={Filters.External}>
                        Only filter CIDs on my lists
                      </ToggleButton>
                    </ToggleButtonGroup>
                  </Col>
                </Row>

                <Row className={"settings-block"}>
                  <Col>
                    <FormCheck
                      type="switch"
                      id="share-lists"
                      label="Share contents of my filter lists with other nodes"
                      checked={this.state.share}
                      onChange={() => this.toggleShare()}
                    />
                    <p className="text-dim">
                      (Private lists will not be affected)
                    </p>
                  </Col>
                </Row>

                <Row className={"settings-block"}>
                  <Col>
                    <FormCheck
                      type="switch"
                      id="enhanced-filtering"
                      label="Use enhanced filtering"
                      checked={this.state.advanced}
                      onChange={() => this.toggleAdvanced()}
                    />
                    <p className="text-dim">
                      BitScreen can auto-filter hashes found in third party
                      databases
                    </p>

                    {this.state.advanced ? (
                      <>
                        <FormCheck
                          type="checkbox"
                          label="Audible Magic (Copyrighted Music)"
                        />

                        <FormCheck type="checkbox" label="PhotoDNA (CSAM)" />

                        <FormCheck
                          type="checkbox"
                          label="GIFCT (Terrorist Content)"
                        />
                      </>
                    ) : null}
                  </Col>
                </Row>
              </>
            ) : null}
          </>
        ) : null}
      </Container>
    );
  }
}

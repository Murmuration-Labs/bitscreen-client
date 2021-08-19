import React, { ComponentType, useEffect, useState } from "react";
import axios from "axios";

import { Col, Container, FormCheck, Row } from "react-bootstrap";
import "./Settings.css";
import { serverUri } from "../../config";
import { Config, SettingsProps } from "../Filters/Interfaces";

export default function Settings(props: ComponentType<SettingsProps>) {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [configuration, setConfiguration] = useState<Config>({
    bitscreen: false,
    share: false,
    advanced: {
      enabled: false,
      list: [],
    },
    filters: {
      external: false,
      internal: false,
    },
  });

  useEffect(() => {
    async function setInitialConfig() {
      const response = await axios.get(`${serverUri()}/config`);
      const config = response.data;

      setLoaded(true);
      setConfiguration(config);
    }

    setInitialConfig();
  }, []);

  const putConfig = async (config: Config): Promise<void> => {
    await axios.put(`${serverUri()}/config`, config);
  };

  const toggleBitScreen = async (): Promise<void> => {
    const newConfig = {
      ...configuration,
      bitscreen: !configuration.bitscreen,
    };
    setConfiguration(newConfig);
    putConfig(newConfig);
  };

  return (
    <Container>
      {loaded ? (
        <>
          <h2>Settings</h2>

          <Row className={"settings-block"}>
            <Col>
              <FormCheck
                type="switch"
                id="bitscreen-switch"
                label="Filter content using BitScreen"
                checked={configuration.bitscreen}
                onChange={() => toggleBitScreen()}
              />
              <p className="text-dim">
                Filtering enables a node operator to decline storage and
                retrieval deals for known CIDs.
              </p>
            </Col>
          </Row>
        </>
      ) : null}
    </Container>
  );
}

import React, { ComponentType, FormEvent, useEffect, useState } from "react";
import axios from "axios";

import { Col, Container, FormCheck, FormGroup, Row } from "react-bootstrap";
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
      console.log("config", config);

      setLoaded(true);
      setConfiguration(config);
    }

    setInitialConfig();
  });

  const putConfig = async (config: Config): Promise<void> => {
    console.log("putting config", config);
    await axios.put(`${serverUri()}/config`, config);
    console.log("config set", config);
  };

  const toggleBitScreen = async (): Promise<void> => {
    const newConfig = {
      ...configuration,
      bitscreen: !configuration.bitscreen,
    };
    setConfiguration(newConfig);
    putConfig(newConfig);
  };

  const toggleShare = async (): Promise<void> => {
    const newConfig = {
      ...configuration,
      share: !configuration.share,
    };
    setConfiguration(newConfig);
    putConfig(newConfig);
  };

  const toggleAdvanced = async (): Promise<void> => {
    const newConfig = {
      ...configuration,
      advanced: {
        ...configuration.advanced,
        enabled: !configuration.advanced.enabled,
      },
    };
    setConfiguration(newConfig);
    putConfig(newConfig);
  };

  const toggleAdvancedFilter = async (filterName: string): Promise<void> => {
    console.log(filterName);
    let list = configuration.advanced.list;

    if (list.includes(filterName)) {
      list = list.filter((e) => e !== filterName);
    } else {
      list.push(filterName);
    }

    const newConfig = {
      ...configuration,
      advanced: {
        ...configuration.advanced,
        list: list,
      },
    };

    setConfiguration(newConfig);
    putConfig(newConfig);
  };

  const setFilter = async (
    event: FormEvent<HTMLDivElement>,
    filterName: string
  ): Promise<void> => {
    event.persist();
    configuration.filters[filterName] = !configuration.filters[filterName];

    putConfig(configuration);
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

          {configuration.bitscreen ? (
            <>
              <Row className={"settings-block"}>
                <Col>
                  <h4>Filter CIDs</h4>
                  <FormGroup controlId={"external"}>
                    <FormCheck
                      checked={
                        configuration.filters
                          ? configuration.filters.external
                          : false
                      }
                      onChange={(evt: FormEvent<HTMLDivElement>) =>
                        setFilter(evt, "external")
                      }
                      type="checkbox"
                      label="blocked by any node"
                    />
                  </FormGroup>
                  <FormGroup controlId={"internal"}>
                    <FormCheck
                      checked={
                        configuration.filters
                          ? configuration.filters.internal
                          : false
                      }
                      onChange={(evt: FormEvent<HTMLDivElement>) =>
                        setFilter(evt, "internal")
                      }
                      type="checkbox"
                      label="on my custom lists"
                    />
                  </FormGroup>
                </Col>
              </Row>

              <Row className={"settings-block"}>
                <Col>
                  <FormCheck
                    type="switch"
                    id="share-lists"
                    label="Share contents of my filter lists with other nodes"
                    checked={configuration.share}
                    onChange={() => toggleShare()}
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
                    checked={configuration.advanced.enabled}
                    onChange={() => toggleAdvanced()}
                  />
                  <p className="text-dim">
                    BitScreen can auto-filter hashes found in third party
                    databases
                  </p>

                  {configuration.advanced.enabled ? (
                    <>
                      <FormCheck
                        type="checkbox"
                        label="Audible Magic (Copyrighted Music)"
                        checked={configuration.advanced.list.includes(
                          "audibleMagic"
                        )}
                        onChange={() => toggleAdvancedFilter("audibleMagic")}
                      />

                      <FormCheck
                        type="checkbox"
                        label="PhotoDNA (CSAM)"
                        checked={configuration.advanced.list.includes(
                          "photoDNA"
                        )}
                        onChange={() => toggleAdvancedFilter("photoDNA")}
                      />

                      <FormCheck
                        type="checkbox"
                        label="GIFCT (Terrorist Content)"
                        checked={configuration.advanced.list.includes("GIFCT")}
                        onChange={() => toggleAdvancedFilter("GIFCT")}
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

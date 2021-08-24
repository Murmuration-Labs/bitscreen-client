import React, { useEffect, useState } from "react";
import { Button, Container } from "react-bootstrap";
import ApiService from "../../services/ApiService";
import ImportFilterModal from "../Filters/ImportFilterModal";
import { Config, FilterList } from "../Filters/Interfaces";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import * as AuthService from "../../services/AuthService";
import { useHistory } from "react-router";
import { serverUri } from "../../config";
import axios from "axios";

const FilterDetailsPage = (props) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [filterId, setFilterId] = useState<number>(0);
  const [filterShareId, setFilterShareId] = useState<string>("");
  const [filterProviderId, setFilterProviderId] = useState<number>(-1);
  const [filterDetails, setFilterDetails] = useState([{}]);
  const [isImported, setIsImported] = useState<boolean>(false);
  const [showImportFilter, setShowImportFilter] = useState<boolean>(false);
  const [toBeImportedFilter, setToBeImportedFilter] = useState<
    FilterList | undefined
  >(undefined);

  const [account, setAccount] = useState(AuthService.getAccount());
  const [configuration, setConfiguration] = useState<Config>({
    bitscreen: false,
    import: false,
    share: false,
  });

  const isImportEnabled = (): boolean => {
    return (
      configuration.bitscreen && configuration.import && !!account?.country
    );
  };

  useEffect(() => {
    async function setInitialConfig() {
      const response = await axios.get(`${serverUri()}/config`);
      const config = response.data;

      setConfiguration(config);
    }

    setInitialConfig();
  }, []);

  useEffect(() => {
    setShowImportFilter(!!toBeImportedFilter);
  }, [toBeImportedFilter]);

  const loadFilter = (shareId: string): void => {
    setFilterShareId(shareId);
    ApiService.getPublicFilterDetails(shareId).then((data: any) => {
      setIsImported(data.isImported);
      const details = [
        { columnName: "Name of list:", columnValue: data.filter.name },
        {
          columnName: "Number of subscribers:",
          columnValue: data.filter.provider_Filters.length - 1,
        },
        { columnName: "Number of CIDs:", columnValue: data.filter.cids.length },
        {
          columnName: "Provider business name:",
          columnValue: data.provider.businessName,
        },
        {
          columnName: "Provider contact person:",
          columnValue: data.provider.contactPerson,
        },
        { columnName: "Provider website:", columnValue: data.provider.website },
        { columnName: "Provider email:", columnValue: data.provider.email },
        { columnName: "Provider address:", columnValue: data.provider.address },
        {
          columnName: "Date last updated:",
          columnValue: data.filter.updated ?? "No data",
        },
      ];
      setFilterDetails(details);
      setFilterId(data.filter.id);
      setFilterProviderId(data.provider.id);
      setLoaded(true);
    });
  };

  useEffect(() => {
    loadFilter(props.match.params.shareId as string);
  }, [props.match.params.shareId]);

  const history = useHistory();
  const providerId = AuthService.getProviderId();

  return (
    <>
      {loaded ? (
        <Container>
          <Paper>
            <TableContainer
              style={{ wordBreak: "break-all", margin: "auto" }}
              component={Paper}
            >
              <Table aria-label="simple table">
                <TableBody>
                  {filterDetails.map((row: any) => (
                    <TableRow key={row.columnName}>
                      <TableCell align="left">
                        <div style={{ fontWeight: "bold" }}>
                          {" "}
                          {row.columnName}{" "}
                        </div>{" "}
                        {row.columnValue}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell>
                      {isImported ? (
                        <Button disabled={true} variant="muted">
                          Imported
                        </Button>
                      ) : filterProviderId != providerId ? (
                        <Button
                          disabled={!isImportEnabled()}
                          onClick={() => {
                            setToBeImportedFilter({ id: filterId } as any);
                          }}
                          variant="outline-primary"
                        >
                          Import
                        </Button>
                      ) : (
                        <Button
                          onClick={() => {
                            history.push(`/filters/edit/${filterId}`);
                          }}
                          variant="outline-dark"
                        >
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          {toBeImportedFilter && (
            <ImportFilterModal
              closeCallback={async (_needsRefresh = false): Promise<void> => {
                setToBeImportedFilter(undefined);
                if (_needsRefresh) {
                  loadFilter(filterShareId);
                }
              }}
              filter={toBeImportedFilter}
              show={showImportFilter}
              prefetch=""
            />
          )}
        </Container>
      ) : null}
    </>
  );
};
export default FilterDetailsPage;

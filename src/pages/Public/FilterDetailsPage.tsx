import React, { useEffect, useState } from "react";
import ApiService from "../../services/ApiService";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
});

const FilterDetailsPage = (props) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [filterDetails, setFilterDetails] = useState([{}]);

  const loadFilter = (id: number): void => {
    ApiService.getPublicFilterDetails(id).then((data: any) => {
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
        { columnName: "Date last updated:", columnValue: data.filter.updated },
      ];
      setFilterDetails(details);
      setLoaded(true);
    });
  };

  useEffect(() => {
    loadFilter(props.match.params.id as number);
  }, [props.match.params.id]);

  const classes = useStyles();

  return (
    <>
      {loaded ? (
        <TableContainer component={Paper}>
          <Table className={classes.table} aria-label="simple table">
            <TableBody>
              {filterDetails.map((row: any) => (
                <TableRow key={row.columnName}>
                  <TableCell style={{ fontWeight: "bold" }} align="right">
                    {row.columnName}
                  </TableCell>
                  <TableCell align="left">{row.columnValue}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </>
  );
};
export default FilterDetailsPage;
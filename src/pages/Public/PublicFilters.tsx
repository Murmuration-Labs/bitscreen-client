import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
} from "@material-ui/core";
import React, { useEffect, useState } from "react";
import { Button, Container, Form } from "react-bootstrap";
import { Link, useHistory } from "react-router-dom";
import ApiService from "../../services/ApiService";
import ImportFilterModal from "../Filters/ImportFilterModal";
import { Config, FilterList } from "../Filters/Interfaces";
import { Data, HeadCell } from "./Interfaces";
import "./PublicFilters.css";
import * as AuthService from "../../services/AuthService";
import { serverUri } from "../../config";
import axios from "axios";
import { formatDate } from "../Filters/utils";

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = "asc" | "desc";

const headCells: HeadCell[] = [
  { id: "name", numeric: false, label: "Filter Name" },
  { id: "cids", numeric: true, label: "# of CIDs" },
  { id: "subs", numeric: true, label: "# of Subs" },
  { id: "providerName", numeric: true, label: "Provider Name" },
  { id: "providerCountry", numeric: true, label: "Provider Country" },
  { id: "description", numeric: false, label: "Description" },
  { id: "updated", numeric: false, label: "Last Updated" },
  { id: "actions", numeric: false, label: "Actions" },
  // { id: "enabled", numeric: false, label: "Enabled" },
];

interface EnhancedTableProps {
  onRequestSort: (
    event: React.MouseEvent<unknown>,
    property: keyof Data
  ) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
  mySort: string;
  mySortBy: string;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const { order, orderBy, rowCount, onRequestSort, mySort, mySortBy } = props;
  const createSortHandler =
    (property: keyof Data) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <span style={{ display: "none" }}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </span>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

export default function PublicFilters() {
  const [order, setOrder] = React.useState<Order>("asc");
  const [orderBy, setOrderBy] = React.useState<keyof Data>("name");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [publicFiltersData, setPublicFiltersData] = React.useState<Data[]>([]);
  const [mySort, setMySort] = React.useState("asc");
  const [mySortBy, setMySortBy] = React.useState("name");
  const [dataCount, setDataCount] = React.useState<number>(0);
  const [searchedValue, setSearchedValue] = React.useState("");
  const [showImportFilter, setShowImportFilter] = useState<boolean>(false);
  const [prefetch, setPrefetch] = useState<string>("");
  const [toBeImportedFilter, setToBeImportedFilter] =
    useState<FilterList | null>(null);
  const [needsRefresh, setNeedsRefresh] = useState(true);

  const history = useHistory();

  const [account, setAccount] = useState(AuthService.getAccount());
  const [configuration, setConfiguration] = useState<Config>({
    bitscreen: false,
    import: false,
    share: false,
  });

  useEffect(() => {
    async function setInitialConfig() {
      const providerId = AuthService.getProviderId();
      const response = await axios.get(`${serverUri()}/config/${providerId}`);
      const config = response.data;

      setConfiguration(config);
    }

    setInitialConfig();
  }, []);

  useEffect(() => {
    setShowImportFilter(!!prefetch || !!toBeImportedFilter);
  }, [prefetch, toBeImportedFilter]);

  useEffect(() => {
    setNeedsRefresh(false);
    const getAllData = async () => {
      await ApiService.getAllFilters(
        page,
        rowsPerPage,
        mySortBy,
        mySort,
        searchedValue
      ).then((response) => {
        setPublicFiltersData(response.data as Data[]);
        setDataCount(response.count);
      });
    };

    getAllData();
  }, [rowsPerPage, page, mySortBy, mySort, searchedValue, needsRefresh]);

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Data
  ) => {
    if (property == "actions") return;

    setMySort(mySort === "asc" ? "desc" : "asc");
    setOrder(mySort === "asc" ? "desc" : "asc");
    setMySortBy(property);
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlerInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchedValue(event.target.value);
  };

  const emptyRows =
    rowsPerPage -
    Math.min(rowsPerPage, publicFiltersData.length - page * rowsPerPage);
  const providerId = AuthService.getProviderId();

  const isImportEnabled = (): boolean => {
    return (
      configuration.bitscreen && configuration.import && !!account?.country
    );
  };

  return (
    <Container>
      <h2>Public Filters</h2>
      {!isImportEnabled() && (
        <p className="text-dim">
          To activate importing, go to{" "}
          <a style={{ fontSize: 12 }} href="/settings">
            Settings
          </a>{" "}
          and add country data.
        </p>
      )}
      <Form.Group controlId="search">
        <Form.Control
          type="text"
          placeholder="Search..."
          onChange={handlerInputChange}
          onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
              event.preventDefault();
            }
          }}
        />
      </Form.Group>
      {searchedValue && (
        <p className="ml-1">
          {dataCount} result{dataCount === 1 ? "" : "s"} found
        </p>
      )}
      <TableContainer>
        <Table aria-label="enhanced table">
          <EnhancedTableHead
            order={order}
            orderBy={orderBy}
            mySort={mySort}
            mySortBy={mySortBy}
            onRequestSort={handleRequestSort}
            rowCount={dataCount}
          />
          <TableBody>
            {/* {stableSort(publicFiltersData, getComparator(order, orderBy))
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) */}
            {publicFiltersData.map((row, index) => {
              return (
                <TableRow key={index}>
                  <TableCell>
                    <Link
                      to={`/directory/details/${row.shareId}`}
                      style={{ fontSize: 14 }}
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell>{row.cids}</TableCell>
                  <TableCell>{row.subs - 1}</TableCell>
                  <TableCell>{row.providerName}</TableCell>
                  <TableCell>{row.providerCountry}</TableCell>
                  <TableCell>{row.description}</TableCell>
                  <TableCell>{formatDate(row.updated)}</TableCell>
                  <TableCell>
                    {row.isImported ? (
                      <Button
                        style={{ marginLeft: -15 }}
                        onClick={() => {
                          history.push(`/filters/edit/${row.shareId}`);
                        }}
                        variant="outline-dark"
                      >
                        Imported
                      </Button>
                    ) : row.providerId != providerId ? (
                      <Button
                        style={{ marginLeft: -5 }}
                        disabled={!isImportEnabled()}
                        onClick={() => {
                          setToBeImportedFilter(row as any);
                        }}
                        variant="outline-primary"
                      >
                        Import
                      </Button>
                    ) : (
                      <Button
                        style={{ marginLeft: -5 }}
                        onClick={() => {
                          history.push(`/filters/edit/${row.shareId}`);
                        }}
                        variant="outline-dark"
                      >
                        Edit
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {emptyRows === 0 && (
              <TableRow>
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={dataCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      {toBeImportedFilter && (
        <ImportFilterModal
          closeCallback={async (_needsRefresh = false): Promise<void> => {
            setPrefetch("");
            setToBeImportedFilter(null);
            setNeedsRefresh(_needsRefresh);
          }}
          filter={toBeImportedFilter}
          show={showImportFilter}
          prefetch={prefetch}
        />
      )}
    </Container>
  );
}

import {
  IconButton,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  TextField,
} from '@material-ui/core';
import ClearIcon from '@material-ui/icons/ClearRounded';
import SearchIcon from '@material-ui/icons/Search';
import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { Link, useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTitle } from 'react-use';
import ApiService from 'services/ApiService';
import * as AuthService from 'services/AuthService';
import LoggerService from 'services/LoggerService';
import EnhancedTableHead from '../Filters/EnhancedTableHead/EnhancedTableHead';
import { ImportFilterModal } from '../../components/Modals/ImportFilterModal/ImportFilterModal';
import { Config, FilterList, Order } from '../Filters/Interfaces';
import { formatDate, isImportEnabled, itemsToPages } from '../Filters/utils';
import { Data, HeadCell } from './Interfaces';
import './PublicFilters.css';
import { AccountType } from 'types/interfaces';

const headCells: HeadCell<Data>[] = [
  { id: 'name', numeric: false, label: 'Filter Name', sortable: true },
  { id: 'cids', numeric: true, label: 'CIDs', sortable: true },
  { id: 'subs', numeric: true, label: 'Subscribers', sortable: true },
  { id: 'providerName', numeric: true, label: 'Provider', sortable: true },
  { id: 'providerCountry', numeric: true, label: 'Country', sortable: true },
  { id: 'description', numeric: false, label: 'Description', sortable: true },
  { id: 'updated', numeric: false, label: 'Updated', sortable: true },
  { id: 'actions', numeric: false, label: 'Actions' },
  // { id: "enabled", numeric: false, label: "Enabled" },
];

export default function PublicFilters(props) {
  useTitle(`Directory - BitScreen`);
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<keyof Data>('name');
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [publicFiltersData, setPublicFiltersData] = React.useState<Data[]>([]);
  const [mySort, setMySort] = React.useState('asc');
  const [mySortBy, setMySortBy] = React.useState('name');
  const [dataCount, setDataCount] = React.useState<number>(0);
  const [searchedValue, setSearchedValue] = React.useState('');
  const [showImportFilter, setShowImportFilter] = useState<boolean>(false);
  const [prefetch, setPrefetch] = useState<string>('');
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

  useEffect(() => LoggerService.info('Loading Directory page.'), []);

  useEffect(() => {
    setConfiguration(props.config);
  }, [props.config]);

  useEffect(() => {
    setShowImportFilter(!!prefetch || !!toBeImportedFilter);
  }, [prefetch, toBeImportedFilter]);

  useEffect(() => {
    setNeedsRefresh(false);
    const getAllData = async () => {
      ApiService.getAllFilters(
        page,
        rowsPerPage,
        mySortBy,
        mySort,
        searchedValue
      ).then(
        (response) => {
          setPublicFiltersData(response.data as Data[]);
          setDataCount(response.count);
        },
        (e) => {
          if (e && e.status === 401 && props.config) {
            toast.error(e.data.message);
            return;
          }
        }
      );
    };

    getAllData();
  }, [rowsPerPage, page, mySortBy, mySort, searchedValue, needsRefresh]);

  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: keyof Data
  ) => {
    if (property == 'actions') return;

    setMySort(mySort === 'asc' ? 'desc' : 'asc');
    setOrder(mySort === 'asc' ? 'desc' : 'asc');
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

  const LongText = ({ content, limit }) => {
    if (content.length <= limit) {
      return <div>{content}</div>;
    }

    const toShow = content.substring(0, limit) + '...';
    return <div>{toShow}</div>;
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          verticalAlign: 'top',
          paddingBottom: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flex: 1,
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              fontSize: 32,
              fontWeight: 600,
              lineHeight: '40px',
            }}
          >
            Directory
          </div>
          <div className="page-subtitle">
            Directory of public filter lists
            {!isImportEnabled(configuration, account) &&
              account?.accountType === AccountType.NodeOperator && (
                <p className="text-dim" style={{ marginRight: 4 }}>
                  To activate importing, go to{' '}
                  <a style={{ fontSize: 12 }} href="/settings">
                    Settings
                  </a>{' '}
                  and add country data.
                </p>
              )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <TextField
          style={{ width: 480, marginRight: 12 }}
          type="text"
          placeholder="Search"
          variant="outlined"
          value={searchedValue}
          onChange={handlerInputChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {searchedValue && (
                  <IconButton
                    onClick={() => {
                      setSearchedValue('');
                    }}
                    color="default"
                  >
                    <ClearIcon />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
          FormHelperTextProps={{ style: { fontSize: 12 } }}
        />
        {searchedValue.length > 0 && (
          <span
            style={{
              marginRight: 4,
              verticalAlign: 'middle',
              alignSelf: 'center',
            }}
          >
            {dataCount ? dataCount : '0'} result
            {dataCount && dataCount === 1 ? '' : 's'} found
          </span>
        )}
      </div>
      <TableContainer>
        <Table aria-label="enhanced table">
          <EnhancedTableHead
            headCells={headCells}
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
                      style={{ fontSize: 14, color: 'blue' }}
                    >
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell>{row.cids}</TableCell>
                  <TableCell>{row.subs - 1}</TableCell>
                  <TableCell>{row.providerName}</TableCell>
                  <TableCell>{row.providerCountry}</TableCell>
                  <TableCell>
                    <LongText content={row.description} limit={20} />
                  </TableCell>
                  <TableCell>{formatDate(row.updated)}</TableCell>
                  <TableCell className="actions-column">
                    {row.isImported ? (
                      <Button
                        style={{
                          marginLeft: -5,
                          color: 'blue',
                          backgroundColor: 'white',
                          borderColor: 'blue',
                          width: 100,
                        }}
                        onClick={() => {
                          history.push(`/filters/edit/${row.shareId}`);
                        }}
                        variant="outline-dark"
                      >
                        Imported
                      </Button>
                    ) : row.providerId != providerId ? (
                      <Button
                        style={{
                          marginLeft: -5,
                          color: 'white',
                          backgroundColor: 'blue',
                          width: 100,
                        }}
                        disabled={!isImportEnabled(configuration, account)}
                        onClick={() => {
                          setToBeImportedFilter(row as any);
                        }}
                        variant="outline-primary"
                      >
                        Import
                      </Button>
                    ) : (
                      <Button
                        style={{ marginLeft: -5, width: 100 }}
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
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={dataCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelDisplayedRows={itemsToPages(rowsPerPage)}
      />
      {toBeImportedFilter && (
        <ImportFilterModal
          closeCallback={async (_needsRefresh = false): Promise<void> => {
            setPrefetch('');
            setToBeImportedFilter(null);
            setNeedsRefresh(_needsRefresh);
          }}
          filter={toBeImportedFilter}
          show={showImportFilter}
          prefetch={prefetch}
        />
      )}
    </>
  );
}

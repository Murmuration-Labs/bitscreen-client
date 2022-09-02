import {
  PublicFilterDetailsCard,
  PublicFilterDetailsDoubleCard,
  PublicFilterDetailsTripleCard,
} from 'components/Cards/Cards';
import PageTitle from 'components/Utils/PageTitle';
import { ImportFilterModal } from 'components/Modals/ImportFilterModal/ImportFilterModal';
import React, { useEffect, useState } from 'react';
import { Badge, Button, Col, Row } from 'react-bootstrap';
import { useHistory } from 'react-router';
import { toast } from 'react-toastify';
import ApiService from 'services/ApiService';
import * as AuthService from 'services/AuthService';
import LoggerService from 'services/LoggerService';
import { Config, FilterList, Visibility } from '../../Filters/Interfaces';
import { formatDate } from '../../Filters/utils';
import './PublicFilterDetails.css';

const PublicFilterDetailsPage = (props) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [filterShareId, setFilterShareId] = useState<string>('');
  const [filterProviderId, setFilterProviderId] = useState<number>(-1);
  const [filterDetails, setFilterDetails] = useState({
    nameOfList: {
      columnName: 'Name of list:',
      columnValue: '',
    },
    numberOfSubscribers: {
      columnName: 'Number of subscribers:',
      columnValue: 0,
    },
    numberOfCids: {
      columnName: 'Number of CIDs:',
      columnValue: 0,
    },
    businessName: {
      columnName: 'Provider business name:',
      columnValue: '',
    },
    contactPerson: {
      columnName: 'Provider contact person:',
      columnValue: '',
    },
    website: {
      columnName: 'Provider website:',
      columnValue: '',
    },
    email: {
      columnName: 'Provider email:',
      columnValue: '',
    },
    address: {
      columnName: 'Provider address:',
      columnValue: '',
    },
    createdAt: {
      columnName: 'Created:',
      columnValue: '',
    },
    updatedAt: {
      columnName: 'Updated:',
      columnValue: '',
    },
    description: {
      columnName: 'Description:',
      columnValue: '',
    },
    country: {
      columnName: 'Country:',
      columnValue: '',
    },
  });
  const [isImported, setIsImported] = useState<boolean>(false);
  const [isUnlisted, setIsUnlisted] = useState<boolean>(false);
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

  useEffect(
    () => LoggerService.info('Loading Public Filter Details page.'),
    []
  );

  useEffect(() => {
    setConfiguration(props.config);
  }, [props.config]);

  const isImportEnabled = (): boolean => {
    return (
      configuration &&
      configuration.bitscreen &&
      configuration.import &&
      !!account?.country
    );
  };

  useEffect(() => {
    setShowImportFilter(!!toBeImportedFilter);
  }, [toBeImportedFilter]);

  const loadFilter = (shareId: string): void => {
    setFilterShareId(shareId);
    ApiService.getPublicFilterDetails(shareId)
      .then((data: any) => {
        setIsImported(data.isImported);
        setIsUnlisted(data.filter.visibility === Visibility.Shared);
        const details = {
          nameOfList: {
            columnName: 'Name of list:',
            columnValue: data.filter.name,
          },
          numberOfSubscribers: {
            columnName: 'Number of subscribers:',
            columnValue: data.filter.provider_Filters.length - 1,
          },
          numberOfCids: {
            columnName: 'Number of CIDs:',
            columnValue: data.filter.cids.length,
          },
          businessName: {
            columnName: 'Provider business name:',
            columnValue: data.filter.provider.businessName,
          },
          contactPerson: {
            columnName: 'Provider contact person:',
            columnValue: data.filter.provider.contactPerson,
          },
          website: {
            columnName: 'Provider website:',
            columnValue: data.filter.provider.website,
          },
          email: {
            columnName: 'Provider email:',
            columnValue: data.filter.provider.email,
          },
          address: {
            columnName: 'Provider address:',
            columnValue: data.filter.provider.address,
          },
          createdAt: {
            columnName: 'Created:',
            columnValue: formatDate(data.filter.created),
          },
          updatedAt: {
            columnName: 'Updated:',
            columnValue: formatDate(data.filter.updated),
          },
          description: {
            columnName: 'Description:',
            columnValue: data.filter.description,
          },
          country: {
            columnName: 'Country:',
            columnValue: data.filter.provider.country,
          },
        };
        setFilterDetails(details);
        setFilterProviderId(data.filter.provider.id);
        setLoaded(true);
      })
      .catch((e) => {
        if (e && e.status === 401 && props.config) {
          toast.error(e.data.message);
          return;
        }
        console.log(e);
        setLoaded(true);
        setError(
          "Filter does not exist or you do not have permission to view it's details."
        );
      });
  };

  useEffect(() => {
    loadFilter(props.match.params.shareId as string);
  }, [props.match.params.shareId]);

  const history = useHistory();
  const providerId = AuthService.getProviderId();

  return (
    <>
      {loaded && error.length > 0 && <h1>{error}</h1>}
      {loaded && error.length === 0 ? (
        <div style={{ padding: '0 25px 0 25px' }}>
          <div className="mb-3 d-flex justify-content-between">
            <div className="d-flex justify-content-between align-items-center">
              <div
                onClick={() =>
                  history.push({
                    pathname: '/directory',
                  })
                }
                style={{
                  marginRight: '17px',
                  fontSize: '36px',
                  lineHeight: '36px',
                  textAlign: 'center',
                  fontWeight: 200,
                  color: '#7A869A',
                  cursor: 'pointer',
                }}
              >
                &#8249;
              </div>
              <PageTitle
                title={`${filterDetails.nameOfList.columnValue} - BitScreen`}
              />
              <div
                style={{
                  marginRight: '12px',
                  fontWeight: 600,
                  fontSize: '32px',
                  lineHeight: '40px',
                }}
              >
                {filterDetails.nameOfList.columnValue}
                {isUnlisted && <Badge variant={'dark'}>Unlisted</Badge>}
              </div>
              <div className="page-subtitle">List details & provider info</div>
            </div>
            <div className="">
              {isImported ? (
                <Button
                  className="head-button-imported"
                  variant="outlined"
                  onClick={() => {
                    history.push(`/filters/edit/${filterShareId}`);
                  }}
                >
                  Imported
                </Button>
              ) : filterProviderId != providerId ? (
                <Button
                  className="head-button"
                  disabled={!isImportEnabled()}
                  onClick={() => {
                    setToBeImportedFilter({
                      shareId: filterShareId,
                    } as any);
                  }}
                >
                  Import filter
                </Button>
              ) : (
                <Button
                  className="head-button"
                  onClick={() => {
                    history.push(`/filters/edit/${filterShareId}`);
                  }}
                >
                  Edit filter
                </Button>
              )}
            </div>
          </div>
          <Row className="mb-3">
            <Col sm={12} md={6}>
              <PublicFilterDetailsCard
                cardTitle="# of Subscribers"
                cardText={filterDetails.numberOfSubscribers.columnValue}
              />
            </Col>
            <Col sm={12} md={6}>
              <PublicFilterDetailsCard
                cardTitle="# of CIDs"
                cardText={filterDetails.numberOfCids.columnValue}
              />
            </Col>
          </Row>
          <Row className="mb-3">
            <Col sm={12} md={12}>
              <PublicFilterDetailsCard
                cardTitle="Description"
                cardText={filterDetails.description.columnValue}
                smallText={true}
              />
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12}>
              <PublicFilterDetailsDoubleCard
                cardTitleLeft="Business Name"
                cardTextLeft={filterDetails.businessName.columnValue}
                cardTitleRight="Contact Person"
                cardTextRight={filterDetails.contactPerson.columnValue}
              />
            </Col>
          </Row>
          <Row className="mb-3">
            <Col xs={12}>
              <PublicFilterDetailsTripleCard
                cardTitleLeft={filterDetails.website.columnName}
                cardTextLeft={filterDetails.website.columnValue}
                cardTextLeftIsLink={true}
                cardTitleCenter={filterDetails.email.columnName}
                cardTextCenter={filterDetails.email.columnValue}
                cardTextCenterIsLink={true}
                cardTitleRight={filterDetails.createdAt.columnName}
                cardTextRight={filterDetails.createdAt.columnValue}
              />
            </Col>
          </Row>
          <Row className="">
            <Col xs={12}>
              <PublicFilterDetailsDoubleCard
                cardTitleLeft="Address"
                cardTextLeft={filterDetails.address.columnValue}
                cardTitleRight="Country"
                cardTextRight={filterDetails.country.columnValue}
              />
            </Col>
          </Row>
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
        </div>
      ) : null}
    </>
  );
};
export default PublicFilterDetailsPage;

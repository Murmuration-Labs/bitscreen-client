import { filter } from "lodash";
import React, { useEffect, useState } from "react";
import ApiService from "../../services/ApiService";
import { CidItem, FilterList } from "../Filters/Interfaces";

const FilterDetailsPage = (props) => {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [filterDetails, setFilterDetails] = useState({});

  const loadFilter = (id: number): void => {
    ApiService.getPublicFilterDetails(id).then((data: any) => {
      const details = {
        filterName: data.filter.name,
        subscribersCount: data.filter.provider_Filters.length - 1,
        cidsCount: data.filter.cids.length,
        provider: data.provider,
        lastUpdated: data.filter.updated,
      };
      setFilterDetails(details);
      setLoaded(true);
    });
  };

  useEffect(() => {
    loadFilter(props.match.params.id as number);
  }, [props.match.params.id]);

  return <>{loaded ? <div>Hello world</div> : null}</>;
};
export default FilterDetailsPage;

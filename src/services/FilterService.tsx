import { FilterList, Visibility } from "../pages/Filters/Interfaces";
import React from "react";

const FilterService = {
  emptyFilterList: (): FilterList => {
    return {
      _id: 0,
      name: "",
      cids: [],
      visibility: Visibility.Private,
      enabled: true,
    };
  },
  renderHashedCid: (hashedCid: string, short = true): JSX.Element => {
    if (short) {
      return (
        <span style={{ fontFamily: "Courier New" }}>
          {hashedCid.substr(0, 16)}...
          {hashedCid.substr(hashedCid.length - 10, 10)}
        </span>
      );
    }

    return <span style={{ fontFamily: "Courier New" }}>{hashedCid}</span>;
  },
};

export default FilterService;

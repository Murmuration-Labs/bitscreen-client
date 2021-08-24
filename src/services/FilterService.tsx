import React from "react";
import { CidItem, FilterList, Visibility } from "../pages/Filters/Interfaces";

const FilterService = {
  emptyFilterList: (): FilterList => {
    return {
      id: 0,
      name: "",
      cids: [],
      visibility: Visibility.Private,
      enabled: true,
      override: false,
      providerId: 0,
      provider: { id: 0 },
      description: "",
      shareId: "",
    };
  },
  renderHashedCid: ({ cid }: CidItem, short = true): JSX.Element => {
    if (short) {
      return (
        <span className="mono-hashes">
          {cid.substr(0, 16)}...
          {cid.substr(cid.length - 10, 10)}
        </span>
      );
    }

    return <span className="mono-hashes">{cid}</span>;
  },
};

export default FilterService;

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
      providerId: 0,
      provider: { id: 0 },
      description: "",
      shareId: "",
    };
  },
};

export default FilterService;

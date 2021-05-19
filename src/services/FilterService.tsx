import { FilterList, Visibility } from "../pages/Filters/Interfaces";

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
};

export default FilterService;

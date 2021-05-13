import axios from "axios";
import {
  FilterList,
  Visibility,
  VisibilityString,
} from "../pages/Filters/Interfaces";
import { serverUri } from "../config";

// For authentication purposes we will use axios.createInstance
// Right now we use straight-forward axios

const ApiService = {
  getFilters: async (): Promise<FilterList[]> => {
    const response = await axios.get(`${serverUri()}/filters`);
    return response.data;
  },

  addFilter: async (filterList: FilterList): Promise<void> => {
    await axios.post(`${serverUri()}/filters`, filterList);
  },

  updateFilter: async (filterList: FilterList): Promise<FilterList[]> => {
    const response = await axios.put(`${serverUri()}/filters`, filterList);
    return response.data;
  },
};

export default ApiService;
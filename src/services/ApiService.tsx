import axios from "axios";
import { FilterList } from "../pages/Filters/Interfaces";
import { serverUri } from "../config";

// For authentication purposes we will use axios.createInstance
// Right now we use straight-forward axios

const ApiService = {
  getFilters: async (searchTerm?: string): Promise<FilterList[]> => {
    const query = searchTerm
      ? `search-filters?search=${searchTerm}`
      : `search-filters`;
    const response = await axios.get(`${serverUri()}/${query}`);
    return response.data;
  },

  addFilter: async (filterList: FilterList): Promise<void> => {
    await axios.post(`${serverUri()}/filters`, filterList);
  },

  updateFilter: async (
    filterList: FilterList | FilterList[]
  ): Promise<FilterList[]> => {
    const response = await axios.put(`${serverUri()}/filters`, filterList);
    return response.data;
  },

  deleteFilter: async (id: number): Promise<void> => {
    await axios.delete(`${serverUri()}/filters/${id}`);
  },

  fetchRemoteFilter: async (filterUri: string): Promise<FilterList> => {
    const response = await axios.get(filterUri);
    return response.data as FilterList;
  },
};

export default ApiService;

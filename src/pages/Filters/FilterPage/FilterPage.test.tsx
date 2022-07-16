import App from "../../App";
import React from "react";
import { configure, mount, shallow } from "enzyme";
import { CidItem, Visibility } from "../Interfaces";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { SnackbarProvider } from "notistack";
import {
  Table,
  TableBody,
  TableContainer,
  TableRow,
  IconButton,
} from "@material-ui/core";
import { useSnackbar, VariantType, WithSnackbarProps } from "notistack";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FilterPage from "./FilterPage";
import ApiService from "services/ApiService";
jest.mock("services/ApiService");

configure({ adapter: new Adapter() });

const mockEnqueue = jest.fn();
jest.mock("notistack", () => ({
  ...jest.requireActual("notistack"),
  useSnackbar: () => {
    return {
      enqueueSnackbar: mockEnqueue,
    };
  },
}));

describe("Cid row tests", () => {
  it("Should render the filter page with the active/inactive toggle", () => {
    (ApiService.getFilter as jest.Mock).mockResolvedValueOnce({
      created: "2021-09-29T11:40:19.541Z",
      updated: null,
      id: 2,
      name: "asdqwe",
      description: "adsasdadsdaszxczxc",
      override: false,
      enabled: true,
      visibility: 1,
      shareId: "6090-756f-22b8-c953",
      cids: [],
      provider: {
        created: "2021-09-29T11:38:17.913Z",
        updated: "2021-09-29T11:38:25.326Z",
        id: 201,
        walletAddressHashed:
          "30cf5b73fcf97e92c7f5ff85d417981bcf9f487f66d1c0b6289f02b1f6959997",
        country: null,
        businessName: null,
        website: null,
        email: null,
        contactPerson: null,
        address: null,
        nonce: "4317964d-8083-41be-a6b4-8c15773f3a70",
      },
      provider_Filters: [
        {
          created: "2021-09-29T11:40:19.573Z",
          updated: "2021-09-29T15:28:13.705Z",
          id: 2,
          active: true,
          notes: null,
          provider: {
            created: "2021-09-29T11:38:17.913Z",
            updated: "2021-09-29T11:38:25.326Z",
            id: 201,
            walletAddressHashed:
              "30cf5b73fcf97e92c7f5ff85d417981bcf9f487f66d1c0b6289f02b1f6959997",
            country: null,
            businessName: null,
            website: null,
            email: null,
            contactPerson: null,
            address: null,
            nonce: "4317964d-8083-41be-a6b4-8c15773f3a70",
          },
        },
      ],
    });

    (ApiService.getProviderConfig as jest.Mock).mockResolvedValueOnce({
      id: 5,
      bitscreen: true,
      import: false,
      share: false,
    });

    const page = shallow(
      <FilterPage
        match={{ params: { shareId: 1 }, isExact: true, path: "", url: "" }}
      />
    );
    // needs refactoring to test with useeffect
  });
});

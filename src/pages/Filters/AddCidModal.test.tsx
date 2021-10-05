import { Table, TableBody, TableContainer, TableRow } from "@material-ui/core";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { configure, mount, shallow } from "enzyme";
import { SnackbarProvider } from "notistack";
import React from "react";
import AddCidModal from "./AddCidModal";

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

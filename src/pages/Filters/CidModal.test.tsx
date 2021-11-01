import { Dialog } from "@material-ui/core";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { configure, shallow } from "enzyme";
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

const propsAdd = {
  cid: {
    tableKey: "_izgahy5yn",
    cid: "",
    refUrl: "",
    edit: true,
    isChecked: false,
    isSaved: false,
  },
  index: -1,
  edit: false,
  open: true,
  handleClose: jest.fn(),
};

const propsEdit = {
  cid: {
    created: "2021-10-18T08:11:36.988Z",
    id: 9,
    cid: "qweqwea",
    refUrl: "",
    tableKey: "_ryz5rfl7k",
    isChecked: true,
    isSaved: false,
  },
  index: 0,
  edit: true,
  open: true,
  handleClose: jest.fn(),
};

describe("CID Modal test", () => {
  it("Should render the Add CID batch modal", () => {
    const page = shallow(<AddCidModal {...propsAdd} />);

    expect(page.find(Dialog).exists()).toBeTruthy();
    expect(page.text().includes("Add CID")).toBeTruthy();
  });

  it("Should render the Edit CID batch modal", () => {
    const page = shallow(<AddCidModal {...propsEdit} />);

    expect(page.find(Dialog).exists()).toBeTruthy();
    expect(page.text().includes("Update CID")).toBeTruthy();
  });

  it("Should have two inputs for CIDs and for URLs", () => {
    const page = shallow(<AddCidModal {...propsAdd} />);

    expect(page.find({ label: "CID" }).exists()).toBeTruthy();
    expect(
      page.find({ label: "Public Complaint URL (Optional)" }).exists()
    ).toBeTruthy();
    // expect(page.text().includes("Add CIDs Batch")).toBeTruthy();
  });

  it("Should trigger closeCallBack on cancel button clicks", () => {
    const page = shallow(<AddCidModal {...propsAdd} />);

    const cancelButton = page.find({ "aria-label": "cancel" });

    cancelButton.simulate("click", {
      stopPropagation: () => {},
    });

    expect(propsAdd.handleClose).toHaveBeenCalledTimes(1);
  });
});

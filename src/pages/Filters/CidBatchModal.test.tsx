import { Dialog } from "@material-ui/core";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { configure, mount, shallow } from "enzyme";
import React from "react";
import AddCidBatchModal from "./AddCidBatchModal";

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
  edit: false,
  closeCallback: jest.fn(),
  show: true,
};

const propsEdit = {
  edit: true,
  closeCallback: jest.fn(),
  show: true,
};

describe("CID Batch Modal test", () => {
  it("Should render the Add CID batch modal", () => {
    const page = shallow(<AddCidBatchModal {...propsAdd} />);

    expect(page.find(Dialog).exists()).toBeTruthy();
    expect(page.text().includes("Add CIDs Batch")).toBeTruthy();
  });

  it("Should render the Edit CID batch modal", () => {
    const page = shallow(<AddCidBatchModal {...propsEdit} />);

    expect(page.find(Dialog).exists()).toBeTruthy();
    expect(page.text().includes("Update CIDs Batch")).toBeTruthy();
  });

  it("Should have two inputs for CIDs and for URLs", () => {
    const page = shallow(<AddCidBatchModal {...propsAdd} />);

    expect(page.find({ label: "CIDs" }).exists()).toBeTruthy();
    expect(page.find({ label: "URL" }).exists()).toBeTruthy();
    // expect(page.text().includes("Add CIDs Batch")).toBeTruthy();
  });

  it("Should trigger closeCallBack on cancel button clicks", () => {
    const page = shallow(<AddCidBatchModal {...propsAdd} />);

    const cancelButton = page.find({ "aria-label": "cancel" });

    cancelButton.simulate("click", {
      stopPropagation: () => {},
    });

    expect(propsAdd.closeCallback).toHaveBeenCalledTimes(1);
  });

  // it("Should return to main component the cids that were given", () => {
  //   const page = mount(<AddCidBatchModal {...propsAdd} />);

  //   const handleCids = jest.fn();

  //   const cidsInput = "asdqwe, bibibib, ertqewwt";

  //   const addButton = page.find({ "aria-label": "add cids" }).at(1);
  //   const addButton2 = page.find({ "aria-label": "add cids" }).at(0);

  //   console.log(addButton.debug());

  //   addButton.simulate("click");
  //   addButton2.simulate("click");

  //   expect(handleCids).toHaveBeenCalledTimes(1);

  //   expect(propsAdd.closeCallback).toHaveBeenCalledTimes(1);
  // });
});

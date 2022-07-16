import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Checkbox, TableCell
} from "@material-ui/core";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { configure, shallow } from "enzyme";
import React from "react";
import {
  OverlayTrigger,
  Tooltip
} from "react-bootstrap";
import EnhancedTableHead, { EnhancedTableProps } from "./EnhancedTableHead";

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

const toggleFilterOverride = jest.fn();
const confirmDelete = jest.fn();

const props: EnhancedTableProps<any> = {
  onRequestSort: jest.fn(),
  headCells: [
    { id: "name", label: "Filter name", numeric: false },
    { id: "scope", label: "Scope", numeric: false },
    { id: "subs", label: "# of Subs", numeric: true },
    { id: "cids", label: "# of Cids", numeric: true },
    {
      id: "enabled",
      label: "Active",
      numeric: false,
      info: (
        <OverlayTrigger
          placement="right"
          delay={{ show: 150, hide: 300 }}
          overlay={
            <Tooltip id="button-tooltip">
              Active filters run on your node to prevent deals with included
              CIDs
            </Tooltip>
          }
        >
          <FontAwesomeIcon
            icon={faQuestionCircle as IconProp}
            color="#7393B3"
            style={{
              marginLeft: 4,
            }}
          />
        </OverlayTrigger>
      ),
    },
    { id: "actions", label: "Actions", numeric: false },
  ],
  enableChecking: true,
  checkedCount: 0,
  itemsCount: 4,
  onMainCheckboxToggle: jest.fn(),
  order: "asc",
  orderBy: "name",
};

describe("Enhanced Table Head test", () => {
  it("Should render the table head and the checkbox - total 7 columns", () => {
    const page = shallow(<EnhancedTableHead {...props} />);

    expect(page.find(TableCell)).toHaveLength(7);

    const checkboxTableCell = page.find(TableCell).at(0);

    expect(checkboxTableCell.find(Checkbox).exists()).toBeTruthy();
    const pageAsText = page.text();

    expect(pageAsText.includes("# of Cids")).toBeTruthy();
    expect(pageAsText.includes("Filter name")).toBeTruthy();
    expect(pageAsText.includes("Actions")).toBeTruthy();
  });

  it("Should render the checkbox as indeterminate when the checked count is smaller than items count", () => {
    const caseProps = {
      ...props,
      itemsCount: 10,
      checkedCount: 5,
    };

    const page = shallow(<EnhancedTableHead {...caseProps} />);

    const checkbox = page.find(Checkbox);

    expect(checkbox.props()["indeterminate"]).toBeTruthy();
    expect(checkbox.props()["checked"]).toBeFalsy();
  });

  it("Should render the checkbox as checked when the checked count is equal to the items count", () => {
    const caseProps = {
      ...props,
      itemsCount: 10,
      checkedCount: 10,
    };

    const page = shallow(<EnhancedTableHead {...caseProps} />);

    const checkbox = page.find(Checkbox);

    expect(checkbox.props()["indeterminate"]).toBeFalsy();
    expect(checkbox.props()["checked"]).toBeTruthy();
  });
});

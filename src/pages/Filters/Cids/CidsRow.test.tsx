import { Table, TableBody, TableContainer, TableRow } from "@material-ui/core";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import { configure, mount, shallow } from "enzyme";
import { SnackbarProvider } from "notistack";
import React from "react";
import CidsRow from "./CidsRow";
import FilterPage from "../FilterPage";

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

const props = {
  filter: {
    providerId: 1,
    created: "2021-09-21T13:56:33.039Z",
    id: 5,
    name: "Edited from cli v2",
    description: "Test 1234 test",
    override: false,
    enabled: true,
    visibility: 2,
    shareId: "fb21-6957-03d2-2d40",
    cids: [
      {
        created: "2021-09-21T13:56:33.058Z",
        id: 17,
        cid: "sdafds",
        refUrl: "",
        tableKey: "1",
        isChecked: false,
        isSaved: true,
      },
    ],
    provider: {
      created: "2021-09-10T09:35:54.713Z",
      updated: "2021-09-28T12:43:20.507Z",
      id: 1,
      walletAddressHashed:
        "d4539a7862192266906ff074c49ac3e5989d2067c82627261fd32d5e4bd4e091",
      country: "Romania",
      businessName: "Stefan123",
      website: "fsdfsd.com",
      email: "manciustefan@gmail.com",
      contactPerson: "asfsada",
      address: "dsadsads",
      nonce: "e0fbadb3-ef17-4a49-b47d-47568adaf978",
    },
  },
  cid: {
    created: "2021-09-21T13:56:33.058Z",
    id: 17,
    cid: "sdafds",
    refUrl: "",
    tableKey: "1",
    isChecked: false,
    isSaved: true,
  },
};

describe("Cid row tests", () => {
  it("Should render a CID row", () => {
    const page = mount(
      <SnackbarProvider>
        <TableContainer>
          <Table size={"small"} stickyHeader>
            <TableBody>
              <CidsRow
                {...props}
                onRowToggle={() => console.log("toggle")}
                onEditClick={() => console.log("edit")}
                onMoveClick={() => console.log("move")}
                onDeleteClick={() => console.log("delete")}
              />
            </TableBody>
          </Table>
        </TableContainer>
      </SnackbarProvider>
    );

    const tableRow = page.find("tr").at(0);
    expect(tableRow.hasClass("MuiTableRow-root"));
    expect(tableRow.hasClass("MuiTableRow-hover"));

    const actionsCell = tableRow.find("td").at(3);
    expect(actionsCell.hasClass("MuiTableCell-root"));

    const editButton = actionsCell.find("svg").at(0);
    expect(editButton.prop("color")).toBe("black");
    const moveButton = actionsCell.find("svg").at(1);
    expect(moveButton.prop("color")).toBe("black");
    const deleteButton = actionsCell.find("svg").at(2);
    expect(deleteButton.prop("color")).toBe("black");
  });

  it("Should change actions color on hover", () => {
    const page = shallow(
      <CidsRow
        {...props}
        onRowToggle={() => console.log("toggle")}
        onEditClick={() => console.log("edit")}
        onMoveClick={() => console.log("move")}
        onDeleteClick={() => console.log("delete")}
      />
    );

    console.log(page.debug());

    const row = page.find(<TableRow />);
    expect(row.exists).toBeTruthy();

    let editIcon = page.find("FontAwesomeIcon").at(0);
    let moveIcon = page.find("FontAwesomeIcon").at(1);
    let deleteIcon = page.find("FontAwesomeIcon").at(2);

    expect(editIcon.prop("color")).toBe("black");
    expect(moveIcon.prop("color")).toBe("black");
    expect(deleteIcon.prop("color")).toBe("black");

    page.simulate("mouseenter");

    editIcon = page.find("FontAwesomeIcon").at(0);
    moveIcon = page.find("FontAwesomeIcon").at(1);
    deleteIcon = page.find("FontAwesomeIcon").at(2);

    expect(editIcon.prop("color")).toBe("blue");
    expect(moveIcon.prop("color")).toBe("orange");
    expect(deleteIcon.prop("color")).toBe("red");

    page.simulate("mouseleave");

    editIcon = page.find("FontAwesomeIcon").at(0);
    moveIcon = page.find("FontAwesomeIcon").at(1);
    deleteIcon = page.find("FontAwesomeIcon").at(2);

    expect(editIcon.prop("color")).toBe("black");
    expect(moveIcon.prop("color")).toBe("black");
    expect(deleteIcon.prop("color")).toBe("black");
  });

  it("Should trigger callbacks", () => {
    const toggleMock = jest.fn();
    const editMock = jest.fn();
    const moveMock = jest.fn();
    const deleteMock = jest.fn();

    const page = shallow(
      <CidsRow
        {...props}
        onRowToggle={toggleMock}
        onEditClick={editMock}
        onMoveClick={moveMock}
        onDeleteClick={deleteMock}
      />
    );

    const row = page.find("WithStyles(ForwardRef(TableRow))").at(0);
    expect(row.exists).toBeTruthy();

    const editButton = page.find("WithStyles(ForwardRef(IconButton))").at(0);
    editButton.simulate("click", {
      stopPropagation: () => {},
    });
    expect(editMock).toHaveBeenCalledTimes(1);

    const moveButton = page.find("WithStyles(ForwardRef(IconButton))").at(1);
    moveButton.simulate("click", {
      stopPropagation: () => {},
    });
    expect(moveMock).toHaveBeenCalledTimes(1);

    const deleteButton = page.find("WithStyles(ForwardRef(IconButton))").at(2);
    deleteButton.simulate("click", {
      stopPropagation: () => {},
    });
    expect(deleteMock).toHaveBeenCalledTimes(1);

    row.simulate("click");
    expect(toggleMock).toHaveBeenCalledTimes(1);
  });
});

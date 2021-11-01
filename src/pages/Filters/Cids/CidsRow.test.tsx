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
  });

  it("Should have edit, delete and move buttons on CID Row", () => {
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

    const editButton = tableRow.find("#edit-cid-button").at(0);
    expect(editButton.prop("aria-label")).toBe("Edit CID");

    const moveButton = tableRow.find("#move-cid-button").at(0);
    expect(moveButton.prop("aria-label")).toBe("Move CID");

    const deleteButton = tableRow.find("#delete-cid-button").at(0);
    expect(deleteButton.prop("aria-label")).toBe("Delete CID");
  });

  it("Clicking on cid link triggers clipboard write text", () => {
    const page = shallow(
      <CidsRow
        {...props}
        onRowToggle={() => console.log("toggle")}
        onEditClick={() => console.log("edit")}
        onMoveClick={() => console.log("move")}
        onDeleteClick={() => console.log("delete")}
      />
    );

    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });

    const row = page.find(TableRow);

    expect(row.exists());
    expect(row.exists(".table-row-cell-text")).toBeTruthy();

    const cidNameCell = page.find({ "aria-label": "CID Name Cell" }).at(0);

    const cidLink = cidNameCell.find("a").at(0);

    cidLink.simulate("click", {
      stopPropagation: () => {},
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it("Should trigger callbacks when clicking on row buttons", () => {
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

import App from "../../App";
import React from "react";
import { configure, mount, shallow } from "enzyme";
import CidsRow from "./CidsRow";
import {CidItem, Visibility} from "../Interfaces";
import Adapter from "@wojtekmaj/enzyme-adapter-react-17";
import {SnackbarProvider} from "notistack";
import {Table, TableBody, TableContainer, TableRow, IconButton} from "@material-ui/core";
import { useSnackbar, VariantType, WithSnackbarProps } from 'notistack';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CidsTable from "./CidsTable";

configure({ adapter: new Adapter() });

const mockEnqueue = jest.fn();
jest.mock('notistack', () => ({
    ...jest.requireActual('notistack'),
    useSnackbar: () => {
        return {
            enqueueSnackbar: mockEnqueue
        };
    }
}));

const props = {
    filter: {
        "providerId": 1,
        "created": "2021-09-21T13:56:33.039Z",
        "updated": null,
        "id": 5,
        "name": "Edited from cli v2",
        "description": "Test 1234 test",
        "override": false,
        "enabled": true,
        "visibility": 2,
        "shareId": "fb21-6957-03d2-2d40",
        "cids": [
            {
                "created": "2021-09-21T13:56:33.058Z",
                "updated": null,
                "id": 17,
                "cid": "sdafds",
                "refUrl": "",
                "tableKey": "1",
                "isChecked": false,
                "isSaved": true
            }
        ],
        "provider": {
            "created": "2021-09-10T09:35:54.713Z",
            "updated": "2021-09-28T12:43:20.507Z",
            "id": 1,
            "walletAddressHashed": "d4539a7862192266906ff074c49ac3e5989d2067c82627261fd32d5e4bd4e091",
            "country": "Romania",
            "businessName": "Stefan123",
            "website": "fsdfsd.com",
            "email": "manciustefan@gmail.com",
            "contactPerson": "asfsada",
            "address": "dsadsads",
            "nonce": "e0fbadb3-ef17-4a49-b47d-47568adaf978"
        }
    },
    cids: [
        {
            "created": "2021-09-21T13:56:33.058Z",
            "updated": null,
            "id": 17,
            "cid": "cid1",
            "refUrl": "",
            "tableKey": "1",
            "isChecked": false,
            "isSaved": true
        },
        {
            "created": "2021-09-21T13:56:33.058Z",
            "updated": null,
            "id": 18,
            "cid": "cid2",
            "refUrl": "",
            "tableKey": "2",
            "isChecked": false,
            "isSaved": true
        }
    ],
    checkedCids: []
}

describe("Cid table tests", () => {
    it("Should render a CID table", () => {
        const page = shallow(
            <CidsTable
                {...props}
                onMainCheckboxToggle={() => {}}
                onCheckboxToggle={() => {}}
                onEditClick={() => {}}
                onMoveClick={() => {}}
                onDeleteClick={() => {}}
            />
        );

        expect(page.find('WithStyles(ForwardRef(TableSortLabel))').at(0).text().includes('CID')).toBe(true)
        expect(page.find('WithStyles(ForwardRef(TableSortLabel))').at(1).text().includes('URL')).toBe(true)
        expect(page.find('WithStyles(ForwardRef(TableSortLabel))').at(2).text().includes('Added')).toBe(true)

        expect(page.find('CidsRow').length).toBe(2)
    })

    it("Should trigger main checkbox toggle callback", () => {
        const mainCheckboxCallback = jest.fn()
        const page = shallow(
            <CidsTable
                {...props}
                onMainCheckboxToggle={mainCheckboxCallback}
                onCheckboxToggle={() => {}}
                onEditClick={() => {}}
                onMoveClick={() => {}}
                onDeleteClick={() => {}}
            />
        );
        const mainCheckbox = page.find('WithStyles(ForwardRef(Checkbox))').at(0)
        mainCheckbox.simulate("change")
        expect(mainCheckboxCallback).toHaveBeenCalledTimes(1)
    })
})

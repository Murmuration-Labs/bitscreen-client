import React from "react";

import { unmountComponentAtNode, render } from "react-dom";

import '@testing-library/jest-dom/extend-expect';
import {act, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ApiService from "../../services/ApiService";

import Filters from "./Filters";
import {Visibility} from "./Interfaces";
import App from "../App";

jest.mock('../../services/ApiService');

let testNumber = Math.floor(Math.random() * 100000000);

let container = null;

const initNavigateToFilters = async (initialFilters = []) => {
    act(() => {
        render(<App />, container);
    });

    (ApiService.getFilters as jest.Mock).mockResolvedValueOnce(initialFilters);

    expect(await screen.findByText("Filters")).toBeInTheDocument();

    await act(async () => await userEvent.click(screen.getByText('Filters')));

    expect(await ApiService.getFilters).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("+ new Filter")).toBeInTheDocument();
};

describe("Filters module", () => {
    beforeAll(() => {
        jest.useFakeTimers();

        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterAll(() => {
        jest.useRealTimers();

        unmountComponentAtNode(container);
        container.remove();
        container = null;
    });

    test("Create random Filter", async () => {
        await initNavigateToFilters();

        (ApiService.addFilter as jest.Mock).mockImplementationOnce((): void => {
            console.log('addFilter called');
        });

        (ApiService.getFilters as jest.Mock).mockResolvedValueOnce([]);

        await act(async () => await userEvent.click(screen.getByText('+ new Filter')));
        await act(async () => await jest.advanceTimersByTime(2000));

        expect(await ApiService.getFilters).toHaveBeenCalledTimes(2);
        expect(await ApiService.addFilter).toHaveBeenCalledTimes(1);
        expect(await screen.findByText("Edit filter list")).toBeInTheDocument();

        (ApiService.getFilters as jest.Mock).mockResolvedValueOnce([{
            _id: 1,
            name: 'New filter (1)',
            visibility: Visibility.Public,
            cids: [],
        }]);

        (ApiService.updateFilter as jest.Mock).mockResolvedValue([{_id: 1}]);

        const newFilterName = `Name-unittest-${testNumber}`;

        await act(async () => await userEvent.type(screen.getByRole('name'), newFilterName));

        expect(await ApiService.updateFilter).toHaveBeenCalledTimes(newFilterName.split("").length);
        expect(await screen.findByText("Name successfully saved.")).toBeInTheDocument();
    });

    test("Edit existing filter", async () => {
        await initNavigateToFilters([{
            _id: 1,
            name: 'New filter (1)',
            visibility: Visibility.Public,
            cids: [],
        }]);

        const nameSuffix = ` - ${testNumber}`;

        (ApiService.updateFilter as jest.Mock).mockResolvedValue([{_id: 1}]);

        (ApiService.getFilters as jest.Mock).mockResolvedValueOnce([{
            _id: 1,
            name: 'New filter (1)',
            visibility: Visibility.Public,
            cids: [],
        }]);

        await act(async () => await userEvent.click(screen.getByText("New filter (1)").closest("a")));

        expect(await screen.findByText("Edit filter list")).toBeInTheDocument();

        await act(async () => await userEvent.type(screen.getByRole('name'), nameSuffix));

        expect(await ApiService.updateFilter).toHaveBeenCalledTimes(nameSuffix.split("").length);
        expect(await screen.findByText("Name successfully saved.")).toBeInTheDocument();
    });
});

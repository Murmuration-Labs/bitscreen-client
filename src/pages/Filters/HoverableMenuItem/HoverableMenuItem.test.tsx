import { Checkbox, MenuItem, TableCell } from '@material-ui/core';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, shallow } from 'enzyme';
import React from 'react';
import HoverableMenuItem, { HoverableMenuItemProps } from './HoverableMenuItem';

configure({ adapter: new Adapter() });

const mockEnqueue = jest.fn();
jest.mock('notistack', () => ({
  ...jest.requireActual('notistack'),
  useSnackbar: () => {
    return {
      enqueueSnackbar: mockEnqueue,
    };
  },
}));

const onClickFunc = jest.fn();

const props: HoverableMenuItemProps = {
  title: 'hoverable item title',
  type: 'default',
  onClick: onClickFunc,
};

describe('Hoverable Menu Item Test', () => {
  it("Should render the hoverable menu item with the text 'hoverable item title'", () => {
    const page = shallow(<HoverableMenuItem {...props} />);

    const menuItem = page.find(MenuItem).at(0);

    expect(menuItem.exists()).toBeTruthy();
    expect(menuItem.props()['aria-label']).toBe('hoverable-menu-item');
    expect(page.text().includes('hoverable item title')).toBeTruthy();
  });

  it('Should trigger the prop function when clicked', () => {
    const page = shallow(<HoverableMenuItem {...props} />);

    const menuItem = page.find(MenuItem).at(0);

    menuItem.simulate('click', {
      stopPropagation: () => {},
    });

    expect(props.onClick).toHaveBeenCalledTimes(1);
  });
});

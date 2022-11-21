import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconButton, MenuItem } from '@material-ui/core';
import MenuButton from '@material-ui/icons/MoreVert';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { configure, shallow } from 'enzyme';
import React from 'react';
import {
  Button,
  Form,
  FormCheck,
  OverlayTrigger,
  Tooltip,
} from 'react-bootstrap';
import DropdownMenu from './DropdownMenu';
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

const toggleFilterOverride = jest.fn();
const confirmDelete = jest.fn();

const props = {
  titleButton: (
    <IconButton size="small">
      <MenuButton />
    </IconButton>
  ),
  children: [
    <MenuItem
      className="dropdown-menu-item"
      key={1}
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onClick={toggleFilterOverride}
    >
      <FormCheck readOnly type="switch" checked={true} />
      <Form.Label
        style={{
          marginRight: 10,
          marginTop: 2,
        }}
        className={'text-dim'}
      >
        Exception{' '}
        <OverlayTrigger
          placement="left"
          delay={{ show: 150, hide: 300 }}
          overlay={
            <Tooltip style={{ zIndex: 100000 }} id="button-tooltip">
              Exception lists prevent CIDs on imported lists from being
              filtered. Exception lists cannot be shared.
            </Tooltip>
          }
        >
          <FontAwesomeIcon
            icon={faQuestionCircle as IconProp}
            color="#7393B3"
            style={{
              marginTop: 2,
            }}
          />
        </OverlayTrigger>
      </Form.Label>
    </MenuItem>,
    <MenuItem className="dropdown-menu-item" key={2} onClick={confirmDelete}>
      <Button variant="outline-danger" style={{ width: '100%' }}>
        Delete
      </Button>
    </MenuItem>,
  ],
};

describe('Dropdown Menu test', () => {
  it('Should render the dropdown menu containing the delete button and override toggle', () => {
    const page = shallow(<DropdownMenu {...props} />);

    const menuItem = page.find('.dropdown-menu-item').at(1);

    menuItem.simulate('click', {
      stopPropagation: () => {},
    });

    expect(confirmDelete).toHaveBeenCalledTimes(1);

    const formCheck = page.find(FormCheck);

    expect(formCheck.exists()).toBeTruthy();
    expect(formCheck.props()['type']).toBe('switch');
  });

  it('Should toggle filter override on click', () => {
    const page = shallow(<DropdownMenu {...props} />);

    const menuItem = page.find(MenuItem).at(0);
    const formCheck = page.find(FormCheck);

    menuItem.simulate('click');

    expect(toggleFilterOverride).toHaveBeenCalledTimes(1);
  });
});

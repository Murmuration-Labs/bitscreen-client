import { Menu } from "@material-ui/core";
import React from "react";
import { Button } from "react-bootstrap";

interface DropdownMenuProps {
  title?: string;
  disabled?: boolean;
  titleButton?: React.ReactElement;
  children: any[] | any;
}

function DropdownMenu(props: DropdownMenuProps) {
  console.log(props.children);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      {props.titleButton ? (
        React.cloneElement(props.titleButton, {
          onClick: handleClick,
          disabled: !!props.disabled,
        })
      ) : (
        <Button disabled={!!props.disabled} onClick={handleClick}>
          {props.title}
        </Button>
      )}
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClickCapture={handleClose}
      >
        {props.children}
      </Menu>
    </div>
  );
}

export default DropdownMenu;

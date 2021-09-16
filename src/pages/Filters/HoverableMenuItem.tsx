import { makeStyles, MenuItem } from "@material-ui/core";
import React, { CSSProperties, SyntheticEvent } from "react";

interface HoverableMenuItemProps {
  title: string;
  type?: "default" | "destructive";
  onClick?: (e?: SyntheticEvent) => void;
  className?: string;
  style?: CSSProperties;
}

const styles = makeStyles({
  primaryAction: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#137BFE",
    borderRadius: 10,
    marginLeft: 4,
    marginRight: 4,
    marginTop: 4,
    color: "#137BFE",
    "&:hover": {
      backgroundColor: "#137BFE",
      color: "white",
    },
  },
  dangerAction: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#FB6471",
    borderRadius: 10,
    marginLeft: 4,
    marginRight: 4,
    marginTop: 4,
    color: "#FB6471",
    "&:hover": {
      backgroundColor: "#FB6471",
      color: "white",
    },
  },
});

function HoverableMenuItem(props: HoverableMenuItemProps): JSX.Element {
  const classes = styles();
  const deduceClassName = () => {
    switch (props.type) {
      case "default":
        return classes.primaryAction;
      case "destructive":
        return classes.dangerAction;
      default:
        classes.primaryAction;
    }
  };

  return (
    <MenuItem
      className={deduceClassName()}
      style={props.style}
      onClick={props.onClick}
    >
      {props.title}
    </MenuItem>
  );
}

export default HoverableMenuItem;

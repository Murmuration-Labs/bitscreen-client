import React from "react"
import { FormCheck, ToggleButton, ToggleButtonGroup } from "react-bootstrap"
import "./Settings.css"

export default class Settings extends React.Component<any, any> {

  render() {
    return (
      <>
        <h2>Settings</h2>

        <div className={"settings-block"}>
          <FormCheck
            type="switch"
            id="bitscreen-switch"
            label="Filter content using BitScreen"
          />
          <p className="text-dim">
            Filtering enables a node operator to decline storage and retrieval deals for known CIDs.
          </p>

          <ToggleButtonGroup
            vertical
            name={"select-filter"}
            type="radio"
            defaultValue={"filterAll"}
          >
            <ToggleButton value={'filterAll'}>Filter CIDs blocked by any node</ToggleButton>
            <ToggleButton value={'filterOnlyMy'}>Only filter CIDs on my lists</ToggleButton>
          </ToggleButtonGroup>
        </div>

        <div className={"settings-block"}>
          <FormCheck
            type="switch"
            id="share-lists"
            label="Share contents of my filter lists with other nodes"
          />
          <p className="text-dim">
            (Private lists will not be affected)
          </p>
        </div>

        <div className={"settings-block"}>
          <FormCheck
            type="switch"
            id="enhanced-filtering"
            label="Use enhanced filtering"
          />
          <p className="text-dim">
            BitScreen can auto-filter hashes found in third party databases
          </p>

          <FormCheck type="checkbox"
                     label="Audible Magic (Copyrighted Music)"/>

          <FormCheck type="checkbox"
                     label="PhotoDNA (CSAM)"/>

          <FormCheck type="checkbox"
                     label="GIFCT (Terrorist Content)"/>
        </div>
      </>
    );
  }
}
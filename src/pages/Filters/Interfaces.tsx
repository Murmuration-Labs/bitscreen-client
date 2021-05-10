import React from "react";

export const VisibilityString: string[] = ["", "Private", "Public", "ThirdParty"]

export enum Visibility {
    None,
    Private,
    Public,
    ThirdParty,
}

export interface CidItem {
    cid: string,
    edit: boolean
}

export interface CidItemProps {
    cidItem: CidItem,
    saveItem: (i: CidItem) => void,
    deleteItem: (i: CidItem) => void,

}

export interface ModalProps {
    filterList: FilterList;
    show: boolean;
    title: string;
    handleClose: () => void;
    modalEntered: () => void;
    dataChanged: (FileList) => void;
    save: () => void
}

export interface FilterList {
    _id?: number;
    name: string;
    cids: string[];
    visibility: Visibility;
    enabled: boolean
}

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
    name: string;
    cids: string[];
    show: boolean;
    handleClose: () => void;
    modalEntered: () => void;
    title: string;
    changeName: (e: React.ChangeEvent<HTMLInputElement>) => void;
    changeVisibility: (e: React.ChangeEvent<HTMLInputElement>) => void;
    visibility: string;
    cidsChanged: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    save: () => void
}

export interface FilterList {
    name: string;
    cids: string[];
    visibility: Visibility;
    enabled: boolean
}

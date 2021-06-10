import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import ApiService from "../../services/ApiService";
import { FilterList, Visibility } from "./Interfaces";

export default function AddFilterPage(props) {
  const history = useHistory();

  const [locked, setLocked] = useState<boolean>(false);

  const createEmptyFilter = async (): Promise<number> => {
    return await ApiService.addFilter({
      visibility: Visibility.Private,
      enabled: true,
    } as FilterList);
  };

  useEffect(() => {
    if (!locked) {
      setLocked(true);

      createEmptyFilter().then((_id) => {
        history.push(`/filters/edit/${_id}`);
      });
    }
  }, []);

  return (
    <>
      <h4>Creating new filter...</h4>
    </>
  );
}

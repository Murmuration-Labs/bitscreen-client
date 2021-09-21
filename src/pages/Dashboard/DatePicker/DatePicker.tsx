import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import moment from "moment";

import "react-datepicker/dist/react-datepicker.css";
import { PeriodType } from "../../Filters/Interfaces";
import "./DatePicker.css";

export function PeriodRange(props) {
  const [periodType, setPeriodType] = useState<PeriodType>();
  const { startDate, endDate } = props.periodInterval;

  useEffect(() => {
    const { periodType } = props;
    setPeriodType(periodType);
  });

  const handleStartDateChange = (date) => {
    const { setPeriodInterval, periodType } = props;

    if (!date) {
      return setPeriodInterval({
        startDate: null,
        endDate: null,
      });
    }

    let newStartDateMoment: moment.Moment = moment(date).startOf("day");
    const endDateMoment = moment(endDate);

    switch (periodType) {
      case PeriodType.daily:
        newStartDateMoment = moment(date).startOf("day");
        break;

      case PeriodType.monthly:
        newStartDateMoment = moment(date).startOf("month");
        break;

      case PeriodType.yearly:
        newStartDateMoment = moment(date).startOf("year");
        break;
    }

    if (newStartDateMoment.isAfter(endDateMoment)) {
      setPeriodInterval({
        startDate: newStartDateMoment.toDate(),
        endDate: null,
      });
    } else {
      setPeriodInterval({
        startDate: newStartDateMoment.toDate(),
        endDate,
      });
    }
  };

  const handleEndDateChange = (date) => {
    const { setPeriodInterval, periodType } = props;
    let newEndDateMoment: moment.Moment = moment(date).endOf("day");

    switch (periodType) {
      case PeriodType.daily:
        newEndDateMoment = moment(date).endOf("day");
        break;

      case PeriodType.monthly:
        newEndDateMoment = moment(date).endOf("month");
        break;

      case PeriodType.yearly:
        newEndDateMoment = moment(date).endOf("year");
        break;
    }

    setPeriodInterval({
      startDate,
      endDate: newEndDateMoment.toDate(),
    });
  };

  return (
    <>
      {periodType === PeriodType.daily && (
        <div className="chart-date-picker-row">
          <DatePicker
            selected={startDate}
            onChange={(date) => handleStartDateChange(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start Date"
            className={`chart-date-picker-dropdown mr-3 ${
              !startDate ? "" : "dropdown-select-icon"
            }`}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            isClearable={startDate ? true : false}
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => handleEndDateChange(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            placeholderText="End Date"
            className={`chart-date-picker-dropdown mr-3`}
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            isClearable={endDate ? true : false}
          />
        </div>
      )}
      {periodType === PeriodType.monthly && (
        <div className="chart-date-picker-row">
          <DatePicker
            selected={startDate}
            onChange={(date) => handleStartDateChange(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start Date"
            className={`chart-date-picker-dropdown mr-3 ${
              !startDate ? "" : "dropdown-select-icon"
            }`}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            isClearable={startDate ? true : false}
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => handleEndDateChange(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            placeholderText="End Date"
            className={`chart-date-picker-dropdown mr-3`}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            isClearable={endDate ? true : false}
          />
        </div>
      )}
      {periodType === PeriodType.yearly && (
        <div className="chart-date-picker-row">
          <DatePicker
            selected={startDate}
            onChange={(date) => handleStartDateChange(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Start Date"
            className={`chart-date-picker-dropdown mr-3 ${
              !startDate ? "" : "dropdown-select-icon"
            }`}
            dateFormat="yyyy"
            showYearPicker
            dropdownMode="select"
            isClearable={startDate ? true : false}
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => handleEndDateChange(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate}
            placeholderText="End Date"
            className={`chart-date-picker-dropdown mr-3`}
            dateFormat="yyyy"
            showYearPicker
            dropdownMode="select"
            isClearable={endDate ? true : false}
          />
        </div>
      )}
    </>
  );
}

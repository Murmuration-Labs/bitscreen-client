import * as am4charts from "@amcharts/amcharts4/charts";
import * as am4core from "@amcharts/amcharts4/core";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import am4themes_kelly from "@amcharts/amcharts4/themes/kelly";
import React, { useRef, useEffect, useState } from "react";
import { ChartDataEntry } from "../../Filters/Interfaces";
import "./DashboardChart.css";

const CHART_ID = "Filtering chart";

export function DashboardChart(props) {
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const { chartData } = props;
    if (!chartRef.current) {
      // Apply chart themes
      // am4core.useTheme(am4themes_animated);
      // am4core.useTheme(am4themes_kelly);

      // Create chart instance
      chartRef.current = am4core.create(CHART_ID, am4charts.XYChart);
      chartRef.current.data = chartData;

      chartRef.current.legend = new am4charts.Legend();
      chartRef.current.legend.useDefaultMarker = true;
      const marker =
        chartRef.current.legend.markers.template.children.getIndex(0);
      marker.cornerRadius(0, 0, 0, 0);
      marker.strokeWidth = 2;
      marker.strokeOpacity = 1;
      marker.stroke = am4core.color("#ccc");

      // Create axes
      const xAxis = chartRef.current.xAxes.push(new am4charts.CategoryAxis());
      xAxis.dataFields.category = "key";
      xAxis.renderer.labels.template.disabled = true;
      xAxis.renderer.minGridDistance = 1;

      xAxis.renderer.cellStartLocation = 0.15;
      xAxis.renderer.cellEndLocation = 0.85;

      const valueAxis = chartRef.current.yAxes.push(new am4charts.ValueAxis());
      valueAxis.renderer.minGridDistance = 50;

      // Create series
      const series = chartRef.current.series.push(new am4charts.ColumnSeries());
      series.dataFields.valueY = "unique_count";
      series.columns.template.width = am4core.percent(100);
      series.dataFields.categoryX = "key";
      series.name = "Total # of CIDs filtered";
      series.fill = am4core.color("#4DA74D");
      series.tooltipText = "[bold]{valueY}[/]";

      const series2 = chartRef.current.series.push(
        new am4charts.ColumnSeries()
      );
      series2.dataFields.valueY = "total_count";
      series2.columns.template.width = am4core.percent(100);
      series2.dataFields.categoryX = "key";
      series2.name = "Total # of requests blocked involving those CIDs";
      series2.fill = am4core.color("#FC6471");
      series2.tooltipText = "[bold]{valueY}[/]";

      // Add cursor
      chartRef.current.cursor = new am4charts.XYCursor();

      // Disable zoom
      chartRef.current.cursor.behavior = "none";
    }

    return () => {
      chartRef.current && chartRef.current.dispose();
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      const { chartData } = props;
      chartRef.current.data = chartData;
    }
  });

  return (
    <div
      id={CHART_ID}
      style={{
        width: "100%",
        height: "425px",
      }}
    />
  );
}

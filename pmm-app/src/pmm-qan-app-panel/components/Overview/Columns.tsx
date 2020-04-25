import React from 'react';
import PolygonChart from 'react-plugins-deps/components/Elements/Charts/PolygonChart/PolygonChart';
import LatencyChart from 'react-plugins-deps/components/Elements/Charts/LatencyChart/LatencyChart';
import { Humanize } from 'react-plugins-deps/components/helpers/Humanization';
import ManageColumns from '../ManageColumns/ManageColumns';
import './OverviewTable.scss';
import Tooltip from 'antd/es/tooltip';
import { Divider } from 'antd';
import { GroupByControl } from '../GroupByControl/GroupByControl';
import { css } from 'emotion';
import {
  COLUMN_WIDTH,
  FIXED_COLUMN_WIDTH,
  MAIN_METRIC_MIN_WIDTH,
  ROW_NUMBER_COLUMN_WIDTH,
  TABLE_X_SCROLL,
} from './OverviewTable.constants';
import { METRIC_CATALOGUE } from '../../panel/QueryAnalytics.constants';
import { QueryTooltip } from '../../../react-plugins-deps/components/Elements/QueryTooltip/QueryTooltip';

const Styling = {
  rowNumber: css`
    word-wrap: normal;
    word-break: normal;
  `,
  mainMetric: mainMetricColumnWidth => css`
    word-wrap: break-word !important;
    word-break: break-word !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    max-width: ${mainMetricColumnWidth - 40}px !important;
    color: rgb(50, 179, 227);
  `,
  tooltipHeader: css`
    padding: 10px;
    padding-left: 30px;
    font-size: 14px;
  `,
  metricsWrapper: css`
    padding-left: 20px !important;
    padding-right: 20px !important;
    padding-bottom: 10px !important;
  `,
  singleMetricWrapper: css`
    margin-top: 15px !important;
    margin-bottom: 15px !important;
  `,
  metricName: css`
    margin-left: 10px !important;
  `,
  metricsListDivider: css`
    background: #a9a9a9 !important;
    margin: 0 !important;
  `,
};

// TODO: calculate table width right and remove it
const MAGIC_WIDTH_FIX = 17;

export const getDefaultColumns = (groupBy, pageNumber, pageSize, columns, onCell) => {
  const mainMetricColumnWidth = Math.max(
    TABLE_X_SCROLL -
      (columns - 1) * FIXED_COLUMN_WIDTH -
      COLUMN_WIDTH * 1.8 -
      ROW_NUMBER_COLUMN_WIDTH +
      MAGIC_WIDTH_FIX,
    MAIN_METRIC_MIN_WIDTH
  );
  // @ts-ignore
  return [
    {
      title: '#',
      dataIndex: 'rowNumber',
      key: 'rowNumber',
      fixed: 'left',
      width: ROW_NUMBER_COLUMN_WIDTH,
      render: (text, record, index) => (
        <div className={Styling.rowNumber}>{index === 0 ? '' : (pageNumber - 1) * pageSize + index}</div>
      ),
    },
    {
      dataIndex: 'mainMetric',
      fixed: 'left',
      width: mainMetricColumnWidth,
      title: () => <GroupByControl />,
      ellipsis: true,
      className: 'overview-main-column',
      onCell: onCell,
      render: (text, record, index) => {
        return (
          <QueryTooltip query={record.fingerprint} show={index !== 0 && record.fingerprint}>
            <div className={Styling.mainMetric(mainMetricColumnWidth)}>
              {index === 0 ? 'TOTAL' : record.fingerprint || record.dimension || 'N/A'}
            </div>
          </QueryTooltip>
        );
      },
    },
  ];
};

export const getOverviewColumn = (metricName, columnIndex, totalValues, orderBy) => {
  const metric = METRIC_CATALOGUE[metricName];
  const isTimeMetric = metricName.endsWith('_time');
  let sortOrder: boolean | string = false;
  if (orderBy === metricName) {
    sortOrder = 'ascend';
  } else if (orderBy === `-${metricName}`) {
    sortOrder = 'descend';
  }
  return {
    sorter: true,
    key: metricName,
    sortOrder: sortOrder,
    sortDirections: ['descend', 'ascend'],
    width: columnIndex === 0 ? COLUMN_WIDTH * 1.8 : FIXED_COLUMN_WIDTH,
    title: () => <ManageColumns placeholder={metricName} currentMetric={metric} width="100%" />,
    render: (text, item) => {
      const stats = item.metrics[metricName].stats;
      const statPerSec = stats.qps || stats.sum_per_sec;
      // @ts-ignore
      const tooltipData = [
        {
          header: isTimeMetric ? 'Per query' : 'Per sec',
          value: isTimeMetric
            ? Humanize.transform(stats.avg, 'time')
            : Humanize.transform(statPerSec, 'number'),
          key: 'qps',
        },
        {
          header: 'Sum',
          value: stats.sum && Humanize.transform(stats.sum, metric.pipeTypes.sumPipe),
          key: 'sum',
        },
        {
          header: 'From total',
          value:
            ((stats.sum_per_sec / totalValues.metrics[metricName].stats.sum_per_sec) * 100).toFixed(2) + ' %',
          key: 'from-total',
        },
      ].filter(tooltip => tooltip.value);

      const latencyTooltipData = [
        { header: '⌜ Min', value: stats.min },
        { header: '⌟ Max', value: stats.max },
        { header: '◦ Avg', value: stats.avg },
        { header: '• 99%', value: stats.p99 },
      ]
        .filter(element => element.value)
        .map(({ header, value }) => ({ header: header, value: Humanize.transform(value) }));

      // @ts-ignore
      const polygonChartProps = {
        data: item.sparkline,
        metricName: metricName,
      };
      const MetricsList = ({ data }) => {
        return (
          <div className={Styling.metricsWrapper} data-qa="metrics-list">
            {data.map((item, index, list) => {
              return (
                // eslint-disable-next-line react/jsx-key
                <div className={Styling.singleMetricWrapper} data-qa={item.key || ''}>
                  <span className={Styling.metricName}>{`${item.header} : ${item.value}`}</span>
                  {list.length === index + 1 ? null : <Divider className={Styling.metricsListDivider} />}
                </div>
              );
            })}
          </div>
        );
      };

      const MetricTooltip = () => {
        return (
          <div>
            <div className={Styling.tooltipHeader}>{metric.humanizeName}</div>
            <Divider style={{ background: '#363434', margin: '0' }} />
            <MetricsList data={tooltipData} />
            {latencyTooltipData.length ? (
              <>
                <Divider style={{ background: '#666666', margin: '0' }} />
                {metricName === 'query_time' && (
                  <LatencyChart {...{ data: stats }} className="latency-chart-container" />
                )}
                <MetricsList data={latencyTooltipData} />
              </>
            ) : null}
          </div>
        );
      };
      return (
        <div className="overview-content-column">
          <div style={{ marginRight: 'auto' }}>
            {columnIndex === 0 && <PolygonChart {...polygonChartProps} />}
          </div>
          <Tooltip
            getPopupContainer={() => document.querySelector('#antd') || document.body}
            placement="left"
            overlayClassName="overview-column-tooltip"
            title={
              (stats.avg && stats.avg !== 'NaN') || (statPerSec && statPerSec !== 'NaN') ? (
                <MetricTooltip />
              ) : null
            }
          >
            {isTimeMetric ? (
              <span
                className="summarize"
                style={{ marginLeft: 'auto', cursor: stats.avg && stats.avg !== 'NaN' ? 'help' : '' }}
              >
                {stats.avg === undefined ? `${Humanize.transform(0, 'time')}` : null}
                {stats.avg === null || stats.avg === 'NaN' ? 'N/A' : null}
                {stats.avg && stats.avg !== 'NaN' ? `${Humanize.transform(stats.avg, 'time')}` : null}
              </span>
            ) : null}
            {!isTimeMetric ? (
              <span
                className="summarize"
                style={{ marginLeft: 'auto', cursor: statPerSec && statPerSec !== 'NaN' ? 'help' : '' }}
              >
                {statPerSec === undefined ? `0 ${metric.units}` : null}
                {statPerSec === null || statPerSec === 'NaN' ? 'N/A' : null}
                {statPerSec && statPerSec !== 'NaN'
                  ? `${Humanize.transform(statPerSec, 'number')} ${metric.units}`
                  : null}
              </span>
            ) : null}
          </Tooltip>
        </div>
      );
    },
  };
};
import React, { useState } from 'react';
import { CheckboxField } from '../../../react-plugins-deps/components/FormComponents/Checkbox/Checkbox';
import { Humanize } from '../../../react-plugins-deps/components/helpers/Humanization';
import { Divider } from 'antd';
import { css } from 'emotion';

const TOP_LIMIT = 5;

const Styling = {
  label: css`
    display: grid;
    grid-template-areas: 'filtername percentagearea';
    grid-template-rows: 30px;
    grid-template-columns: 160px auto;
    grid-gap: 10px;
    height: auto;
    margin: 0;
  `,
  filterName: css`
    grid-area: filtername;
  `,
  percentage: css`
    grid-area: percentagearea;
    display: flex;
    justify-content: flex-end;
  `,
};

export const CheckboxGroup = ({ form, name, items, group, showAll, filter, labels }) => {
  const [showTop, setShowTop] = useState(false);
  const data = showTop ? items.slice(0, TOP_LIMIT) : items;
  const itemsList = data
    .filter(item => item.value)
    .filter(item => {
      if (!showAll) {
        return item.checked;
      }
      return true;
    })
    .filter(item => item.value.toLowerCase().includes(filter.toLowerCase()))
    .map(item => {
      // If there is no value - disable checkbox and hide percent
      const isValue = item.hasOwnProperty('main_metric_percent');
      return (
        <div className={Styling.label}>
          <span className={Styling.filterName}>
            <CheckboxField
              form={form}
              name={`${group}:${item.value}`}
              label={item.value}
              checked={labels && labels[group] && labels[group].includes(item.value)}
              disabled={!isValue}
            />
          </span>
          {isValue ? (
            <span className={Styling.percentage}>
              <span>{Humanize.transform(item.main_metric_percent, 'percent')}</span>
            </span>
          ) : null}
        </div>
      );
    });
  return itemsList.length ? (
    <div>
      <p style={{ display: 'flex', justifyItems: 'space-between', marginBottom: '0', marginTop: '20px' }}>
        <span style={{ marginRight: 'auto' }}>{name}</span>
        {items.length > TOP_LIMIT ? (
          <span
            onClick={() => {
              setShowTop(!showTop);
            }}
            style={{ cursor: 'pointer' }}
          >
            {showTop ? `Show all (${items.length})` : `Show top ${TOP_LIMIT}`}
          </span>
        ) : (
          <span></span>
        )}
      </p>
      <Divider style={{ marginTop: '0', marginBottom: '5px' }}></Divider>
      {itemsList}
    </div>
  ) : null;
};
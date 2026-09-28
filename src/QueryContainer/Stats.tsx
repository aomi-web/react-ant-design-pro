import { ProDescriptions } from '@ant-design/pro-components';
import type { ProDescriptionsColumn, ProDescriptionsProps } from '@ant-design/pro-components';
import { Card } from 'antd';
import React from 'react';

export const DEFAULT_COLUMNS: Array<ProDescriptionsColumn> = [{
  label: '总记录数',
  dataIndex: 'totalElements',
  valueType: 'digit'
}];

export type StatsProps = {} & ProDescriptionsProps;

/**
 * 统计信息展示
 * @param columns
 * @param props
 * @constructor
 */
export function Stats({ columns = DEFAULT_COLUMNS, ...props }: StatsProps) {
  return (
    <Card>
      <ProDescriptions columns={columns} size="small" column={4} {...props}/>
    </Card>
  );

}

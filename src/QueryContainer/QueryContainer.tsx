import React, { useContext, useState } from "react";
import {
  PageContainer,
  ProDescriptions,
  ProTable,
} from "@ant-design/pro-components";
import type {
  ActionType,
  PageContainerProps,
  ParamsType,
  ProDescriptionsProps,
  ProTableProps,
} from "@ant-design/pro-components";
import {
  Button,
  ButtonProps,
  Modal,
  ModalProps,
  Popconfirm,
  PopconfirmProps,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type {
  RowSelectMethod,
  TableRowSelection,
} from "antd/lib/table/interface";
import { hasAuthorities } from "@aomi/utils";
import { AntDesignProContext } from "../provider";

export interface QueryContainerState<T> {
  selectedRowKeys: Array<string>;
  selectedRows: Array<T>;
  rowSelectMethod?: RowSelectMethod;
}

export type ActionButtonProps = ButtonProps & {
  authorities?: string | Array<string> | boolean;
  popconfirmProps?: PopconfirmProps;
};

export interface QueryContainerProps<T, U extends ParamsType> {
  addAuthorities?: Array<string> | string;
  editAuthorities?: Array<string> | string;
  delAuthorities?: Array<string> | string;

  onAdd?: (state: QueryContainerState<T>) => void;
  onEdit?: (state: QueryContainerState<T>) => void;
  onDelete?: (
    keys: string | Array<string>,
    state: QueryContainerState<T>,
    reset: () => void,
  ) => void | Promise<void>;

  addUri?: string;
  editUri?: string;
  detailUri?: string;
  onDetail?: (state: QueryContainerState<T>) => void;
  editDisabled?: (state: QueryContainerState<T>) => boolean;
  onRowDetail?: (record: any, index: number, nativeOnRowDetail: Function) => void;
  detailProps?:
    | Array<ProDescriptionsProps>
    | ((record: any) => Array<ProDescriptionsProps>);
  detailModalProps?: ModalProps;
  getActionButtonProps?: (
    state: QueryContainerState<T>,
  ) => Array<ActionButtonProps>;

  container?: PageContainerProps;
  table?: ProTableProps<T, U>;
  actionRef?: React.Ref<ActionType>;
}

function navigate(
  context: any,
  state: any,
  callback: any,
  uri: string | undefined,
) {
  if (uri) {
    context?.navigate({ pathname: uri, params: state });
    return;
  }
  callback && callback(state);
}

export const QueryContainer: React.FC<
  React.PropsWithChildren<QueryContainerProps<any, any>>
> = function QueryContainer(props) {
  const context = useContext(AntDesignProContext);
  const {
    onDetail,
    detailUri,
    onAdd,
    addUri,
    addAuthorities,
    onEdit,
    editUri,
    editAuthorities,
    editDisabled,
    onDelete,
    delAuthorities,
    getActionButtonProps,
    container,
    table,
    actionRef,
    onRowDetail,
    detailProps,
    detailModalProps = {},
    children,
  } = props;

  const [selectedRows, setSelectedRows] = useState<Array<any>>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string>>([]);
  const [rowSelectMethod, setRowSelectMethod] = useState<RowSelectMethod>();
  const [detailConfig, setDetailConfig] = useState({
    visible: false,
    record: {},
  });

  const {
    rowSelection,
    toolbar,
    columns = [],
    ...otherTable
  } = table || {};

  const state = { selectedRows, selectedRowKeys, rowSelectMethod };

  const buttonProps: Array<ActionButtonProps> = [];
  getActionButtonProps && buttonProps.push(...getActionButtonProps(state));

  if (onDetail || detailUri) {
    buttonProps.push({
      type: "primary",
      disabled: selectedRowKeys.length !== 1,
      onClick: () =>
        navigate(context, state, onDetail, detailUri),
      children: (
        <>
          <InfoCircleOutlined /> 详情
        </>
      ),
    });
  }
  if (onAdd || addUri) {
    buttonProps.push({
      authorities: addAuthorities,
      type: "primary",
      onClick: () => navigate(context, state, onAdd, addUri),
      children: (
        <>
          <PlusOutlined /> 新增
        </>
      ),
    });
  }
  if (onEdit || editUri) {
    buttonProps.push({
      authorities: editAuthorities,
      disabled: editDisabled
        ? editDisabled(state)
        : selectedRowKeys.length !== 1,
      type: "primary",
      onClick: () => navigate(context, state, onEdit, editUri),
      children: (
        <>
          <EditOutlined /> 编辑
        </>
      ),
    });
  }
  if (onDelete) {
    buttonProps.push({
      authorities: delAuthorities,
      danger: true,
      disabled: selectedRowKeys.length <= 0,
      popconfirmProps: { title: "您确定要删除该条数据吗?" },
      onClick: () => {
        const keys =
          selectedRowKeys.length === 1
            ? selectedRowKeys[0]
            : selectedRowKeys;
        onDelete(keys, state, () => {
          setSelectedRows([]);
          setSelectedRowKeys([]);
        });
      },
      children: (
        <>
          <DeleteOutlined /> 删除
        </>
      ),
    });
  }

  const actions = buttonProps
    .filter((item) =>
      item.authorities ? hasAuthorities(item.authorities) : true,
    )
    .map(({ popconfirmProps, onClick, ...item }, idx) =>
      popconfirmProps ? (
        <Popconfirm key={idx} {...popconfirmProps} onConfirm={onClick as any}>
          <Button {...item} />
        </Popconfirm>
      ) : (
        <Button key={idx} {...item} onClick={onClick} />
      ),
    );

  const newRowSelection: TableRowSelection = {
    type: "radio",
    ...rowSelection,
    onChange: (keys, rows, info) => {
      setSelectedRows(rows);
      setSelectedRowKeys(keys as string[]);
      setRowSelectMethod(info.type);
      const rs = rowSelection as TableRowSelection | false;
      if (rs && rs.onChange) rs.onChange(keys, rows, info);
    },
  };

  let tableColumns = columns;
  if (detailProps) {
    tableColumns = [
      ...columns,
      {
        title: " ",
        valueType: "option",
        fixed: "right",
        render: (_: any, record: any, index: number) => [
          <a
            key="detail"
            onClick={() => {
              const nativeClick = () =>
                setDetailConfig({ visible: true, record });
              onRowDetail
                ? onRowDetail(record, index, nativeClick)
                : nativeClick();
            }}
          >
            详情
          </a>,
        ],
      },
    ];
  }

  return (
    <PageContainer onBack={context?.goBack} {...container}>
      <ProTable
        rowKey="id"
        size="small"
        bordered
        dateFormatter={false}
        actionRef={actionRef}
        scroll={{ x: "max-content", scrollToFirstRowOnChange: true }}
        columns={tableColumns}
        rowSelection={newRowSelection}
        toolbar={{ actions, ...toolbar }}
        {...otherTable}
      />
      <Modal
        open={detailConfig.visible}
        onCancel={() => setDetailConfig({ visible: false, record: {} })}
        width="80%"
        {...detailModalProps}
      >
        {(typeof detailProps === "function"
          ? detailProps(detailConfig.record)
          : detailProps
        )?.map((item, index) => (
          <ProDescriptions
            dataSource={detailConfig.record}
            column={4}
            {...item}
            key={index}
          />
        ))}
      </Modal>
      {children}
    </PageContainer>
  );
};

import React, { useContext, useState } from "react"
import { PageContainer, ProDescriptions, ProTable } from "@ant-design/pro-components"
import type {
  ActionType,
  PageContainerProps,
  ParamsType,
  ProDescriptionsProps,
  ProTableProps,
} from "@ant-design/pro-components"
import {
  Button,
  ButtonProps,
  Dropdown,
  Modal,
  ModalProps,
  Popconfirm,
  PopconfirmProps,
  Space,
} from "antd"
import { DownOutlined, PlusOutlined } from "@ant-design/icons"
import type { RowSelectMethod, TableRowSelection } from "antd/lib/table/interface"
import { hasAuthorities } from "@aomi/utils"
import { AntDesignProContext } from "../provider"

export interface QueryContainerState<T> {
  selectedRowKeys: Array<string>
  selectedRows: Array<T>
  rowSelectMethod?: RowSelectMethod
}

export type ActionButtonProps = ButtonProps & {
  authorities?: string | Array<string> | boolean
  popconfirmProps?: PopconfirmProps
}

export interface QueryContainerProps<T, U extends ParamsType> {
  addAuthorities?: Array<string> | string
  editAuthorities?: Array<string> | string
  delAuthorities?: Array<string> | string

  onAdd?: (state: QueryContainerState<T>) => void
  onEdit?: (state: QueryContainerState<T>) => void
  onDelete?: (
    keys: string | Array<string>,
    state: QueryContainerState<T>,
    reset: () => void,
  ) => void | Promise<void>

  addUri?: string
  editUri?: string
  detailUri?: string
  onDetail?: (state: QueryContainerState<T>) => void
  editDisabled?: (state: QueryContainerState<T>) => boolean
  onRowDetail?: (record: any, index: number, nativeOnRowDetail: Function) => void
  detailProps?: Array<ProDescriptionsProps> | ((record: any) => Array<ProDescriptionsProps>)
  detailModalProps?: ModalProps

  getActionButtonProps?: (state: QueryContainerState<T>) => Array<ActionButtonProps>

  getMoreActionProps?: (state: QueryContainerState<T>) => Array<ActionButtonProps>

  container?: PageContainerProps
  table?: ProTableProps<T, U>
  actionRef?: React.Ref<ActionType>
}

function navigate(context: any, state: any, callback: any, uri: string | undefined) {
  if (uri) {
    context?.navigate({ pathname: uri, params: state })
    return
  }
  callback && callback(state)
}

export const QueryContainer: React.FC<React.PropsWithChildren<QueryContainerProps<any, any>>> =
  function QueryContainer(props) {
    const context = useContext(AntDesignProContext)
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
      getMoreActionProps,
      container,
      table,
      actionRef,
      onRowDetail,
      detailProps,
      detailModalProps = {},
      children,
    } = props

    const [detailConfig, setDetailConfig] = useState({
      visible: false,
      record: {},
    })

    const { rowSelection, toolbar, columns = [], ...otherTable } = table || {}

    const renderButtons = (buttons: Array<ActionButtonProps>) =>
      buttons
        .filter((item) => (item.authorities ? hasAuthorities(item.authorities) : true))
        .map(({ popconfirmProps, onClick, ...item }, idx) =>
          popconfirmProps ? (
            <Popconfirm key={idx} {...popconfirmProps} onConfirm={onClick as any}>
              <Button {...item} />
            </Popconfirm>
          ) : (
            <Button key={idx} {...item} onClick={onClick} />
          ),
        )

    const openDetail = (record: any, index: number) => {
      const nativeClick = () => setDetailConfig({ visible: true, record })
      onRowDetail ? onRowDetail(record, index, nativeClick) : nativeClick()
    }

    // 行内动作：详情、编辑内联；其余（删除/启停/自定义）收进「更多」下拉
    const renderRowActions = (record: any, index: number) => {
      const rowState = {
        selectedRows: [record],
        selectedRowKeys: [record.id],
        rowSelectMethod: undefined,
      }
      const inline: Array<ActionButtonProps> = []
      const more: Array<ActionButtonProps> = []

      if (detailProps) {
        inline.push({
          type: "link",
          size: "small",
          children: "详情",
          onClick: () => openDetail(record, index),
        })
      }
      if (onDetail || detailUri) {
        inline.push({
          type: "link",
          size: "small",
          children: "详情",
          onClick: () => navigate(context, rowState, onDetail, detailUri),
        })
      }
      if (onEdit || editUri) {
        inline.push({
          type: "link",
          size: "small",
          authorities: editAuthorities,
          disabled: editDisabled ? editDisabled(rowState) : false,
          children: "编辑",
          onClick: () => navigate(context, rowState, onEdit, editUri),
        })
      }

      getMoreActionProps && more.push(...getMoreActionProps(rowState))

      if (onDelete) {
        more.push({
          danger: true,
          authorities: delAuthorities,
          popconfirmProps: { title: "您确定要删除该条数据吗?" },
          children: "删除",
          onClick: () => onDelete(record.id, rowState, () => {}),
        })
      }
      getActionButtonProps && inline.push(...getActionButtonProps(rowState))

      const filterFn = (item: ActionButtonProps) =>
        item.authorities ? hasAuthorities(item.authorities) : true

      const inlineNodes = inline
        .filter(filterFn)
        .map(({ onClick, ...item }, idx) => <Button key={idx} {...item} onClick={onClick} />)

      const moreItems = more.filter(filterFn).map((item, idx) => {
        const { popconfirmProps, children, onClick, danger, disabled } = item
        const fire = () => (onClick as any)?.()
        return {
          key: idx,
          label: children as any,
          danger,
          disabled,
          onClick: () => {
            if (popconfirmProps) {
              Modal.confirm({ title: popconfirmProps.title as any, onOk: fire })
            } else {
              fire()
            }
          },
        }
      })

      return (
        <Space size={0}>
          {inlineNodes}
          {moreItems.length > 0 && (
            <Dropdown menu={{ items: moreItems }}>
              <Button type="link" size="small">
                更多 <DownOutlined />
              </Button>
            </Dropdown>
          )}
        </Space>
      )
    }

    // 顶部 toolbar：只保留「新增」
    const toolbarButtons: Array<ActionButtonProps> = []
    if (onAdd || addUri) {
      toolbarButtons.push({
        authorities: addAuthorities,
        type: "primary",
        onClick: () =>
          navigate(
            context,
            { selectedRows: [], selectedRowKeys: [], rowSelectMethod: undefined },
            onAdd,
            addUri,
          ),
        children: (
          <>
            <PlusOutlined /> 新增
          </>
        ),
      })
    }
    const actions = renderButtons(toolbarButtons)

    const newRowSelection: TableRowSelection = {
      type: "radio",
      ...rowSelection,
      onChange: (keys, rows, info) => {
        const rs = rowSelection as TableRowSelection | false
        if (rs && rs.onChange) rs.onChange(keys, rows, info)
      },
    }

    const hasRowActions = !!(
      onEdit ||
      editUri ||
      onDelete ||
      onDetail ||
      detailUri ||
      detailProps ||
      getActionButtonProps
    )

    let tableColumns = columns
    if (hasRowActions) {
      tableColumns = [
        ...tableColumns,
        {
          title: "操作",
          valueType: "option",
          fixed: "right",
          render: (_: any, record: any, index: number) => renderRowActions(record, index),
        },
      ]
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
            <ProDescriptions dataSource={detailConfig.record} column={4} {...item} key={index} />
          ))}
        </Modal>
        {children}
      </PageContainer>
    )
  }

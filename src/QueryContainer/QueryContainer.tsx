import React, { forwardRef, useContext, useRef, useState } from "react";
import { observer } from "mobx-react";
import { PageContainer, ProDescriptions, ProTable } from "@ant-design/pro-components";
import type { PageContainerProps, ParamsType, ProDescriptionsProps, ProTableProps } from "@ant-design/pro-components";
import { hasAuthorities, ObjectUtils } from "@aomi/utils";
import {
  Button,
  ButtonProps,
  FormInstance,
  Modal,
  ModalProps,
  Popconfirm,
  PopconfirmProps,
  TablePaginationConfig,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { Stats } from "./Stats";
import type { RowSelectMethod, TableRowSelection } from "antd/lib/table/interface";
import { AntDesignProContext, Location } from "../provider";
import { BaseService } from "@aomi/common-service/BaseService";

export interface QueryContainerState<T> {
  selectedRowKeys: Array<string>;
  selectedRows: Array<T>;
  rowSelectMethod: RowSelectMethod;
}

export type ActionButtonProps = ButtonProps & {
  authorities?: string | Array<string> | boolean;
  /**
   * 气泡确认框参数
   */
  popconfirmProps?: PopconfirmProps;
};

export interface QueryContainerProps<T, U extends ParamsType> {
  addAuthorities?: Array<string> | string;
  editAuthorities?: Array<string> | string;
  delAuthorities?: Array<string> | string;

  /**
   * 新增按钮点击
   * @param state 当前页面state
   */
  onAdd?: (state: QueryContainerState<T>) => void;
  /**
   * 编辑按钮点击
   * @param state 当前页面state
   */
  onEdit?: (state: QueryContainerState<T>) => void;
  /**
   * 删除按钮页面点击.
   * 当存在该值时,service中的del方法不会执行。否则执行service中的del方法
   * @param keys 当前选择的数据keys
   * @param state 当前页面state
   */
  onDel?: (
    keys: string | Array<string>,
    state: QueryContainerState<T>,
    handleResetRowKeys: () => void
  ) => void;

  /**
   * 新增页面uri
   */
  addUri?: string;

  /**
   * 编辑页面uri
   */
  editUri?: string;

  /**
   * 用户判断编辑按钮是否禁用
   * @param state 当前页面状态
   */
  editDisabled?: (state: QueryContainerState<T>) => boolean;

  /**
   * 详情页面uri
   */
  detailUri?: string;

  /**
   * 详情按钮点击
   * @param state 当前页面state
   */
  onDetail?: (state: QueryContainerState<T>) => void;

  /**
   * 行内详情按钮点击
   * @param record 当前行数据
   * @param index 当前索引
   * @param nativeOnRowDetail 自带行详情处理逻辑。自行选择是否触发组件自带的行详情点击逻辑，触发则弹出详情框。
   */
  onRowDetail?: (
    record: any,
    index: number,
    nativeOnRowDetail: Function
  ) => void;

  /**
   * 详情显示属性,在column中显示详情按钮
   */
  detailProps?:
    | Array<ProDescriptionsProps>
    | ((record) => Array<ProDescriptionsProps>);

  /**
   * 模态框属性配置
   */
  detailModalProps?: ModalProps;

  /**
   * 获取按钮组件的props
   * @param state 页面状态参数
   */
  getActionButtonProps?: (
    state: QueryContainerState<T>
  ) => Array<ActionButtonProps>;

  container?: PageContainerProps;

  table?: ProTableProps<T, U>;

  service?: BaseService<T>;

  showStats?: boolean;
  statsColumns?: ProDescriptionsProps["columns"];
  statsProps?: ProDescriptionsProps;

  defaultSearchParams?: Record<any, any>;
}

function handleDetail(location: Location, state, onDetail, detailUri) {
  if (detailUri) {
    location.navigate({
      pathname: detailUri,
      params: state,
    });
    return;
  }
  onDetail && onDetail(state);
}

function handleAdd(location: Location, state, onAdd, addUri) {
  if (addUri) {
    location.navigate({
      pathname: addUri,
      params: state,
    });
    return;
  }
  onAdd && onAdd(state);
}

function handleEdit(location: Location, state, onEdit, editUri) {
  if (editUri) {
    location.navigate({
      pathname: editUri,
      params: state,
    });
    return;
  }
  onEdit && onEdit(state);
}

function handleDel(
  state,
  onDel,
  service: BaseService<any>,
  setSelectedRows,
  setSelectedRowKeys
) {
  const { selectedRowKeys } = state;
  const keys =
    selectedRowKeys.length === 1 ? selectedRowKeys[0] : selectedRowKeys;

  function handleResetRowKeys() {
    setSelectedRows([]);
    setSelectedRowKeys([]);
  }

  if (onDel) {
    onDel(keys, state, handleResetRowKeys);
  } else if (service) {
    service.del(keys, { state, resetSelectedRows: handleResetRowKeys });
  }
}

function renderActionButton(
  { authorities, popconfirmProps, onClick, ...item }: ActionButtonProps,
  idx: number
) {
  if (popconfirmProps) {
    return (
      <Popconfirm {...popconfirmProps} onConfirm={onClick as any}>
        <Button key={idx} {...item} />
      </Popconfirm>
    );
  }

  return <Button key={idx} {...item} onClick={onClick} />;
}

function getActionButtons({
  selectedRows,
  setSelectedRows,
  selectedRowKeys,
  setSelectedRowKeys,
  rowSelectMethod,
  onDetail,
  detailUri,
  onAdd,
  addUri,
  addAuthorities,
  onEdit,
  editUri,
  editAuthorities,
  editDisabled,
  onDel,
  delAuthorities,
  service,
  getActionButtonProps,
  location,
}) {
  const state = { selectedRows, selectedRowKeys, rowSelectMethod };

  const buttonProps: Array<ActionButtonProps> = [];
  getActionButtonProps && buttonProps.push(...getActionButtonProps(state));

  (onDetail || detailUri) &&
    buttonProps.push({
      type: "primary",
      disabled: selectedRowKeys.length !== 1,
      onClick: () => handleDetail(location, state, onDetail, detailUri),
      children: (
        <>
          <InfoCircleOutlined /> {"详情"}
        </>
      ),
    });

  (onAdd || addUri) &&
    buttonProps.push({
      authorities: addAuthorities,
      type: "primary",
      onClick: () => handleAdd(location, state, onAdd, addUri),
      children: (
        <>
          <PlusOutlined /> {"新增"}
        </>
      ),
    });

  (onEdit || editUri) &&
    buttonProps.push({
      authorities: editAuthorities,
      disabled: editDisabled
        ? editDisabled(state)
        : selectedRowKeys.length !== 1,
      type: "primary",
      onClick: () => handleEdit(location, state, onEdit, editUri),
      children: (
        <>
          <EditOutlined /> {"编辑"}
        </>
      ),
    });

  onDel &&
    buttonProps.push({
      authorities: delAuthorities,
      danger: true,
      onClick: () =>
        handleDel(state, onDel, service, setSelectedRows, setSelectedRowKeys),
      disabled: selectedRowKeys.length <= 0,
      popconfirmProps: {
        title: "您确定要删除该条数据吗?",
      },
      children: (
        <>
          <DeleteOutlined /> {"删除"}
        </>
      ),
    });

  return buttonProps
    .filter((item) =>
      item.authorities ? hasAuthorities(item.authorities) : true
    )
    .map(renderActionButton);
}

export const QueryContainer: React.FC<
  React.PropsWithChildren<QueryContainerProps<any, any>>
> = observer(
  forwardRef<any, React.PropsWithChildren<QueryContainerProps<any, any>>>(
    function QueryContainer(inProps, ref) {
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
        onDel,
        delAuthorities,
        getActionButtonProps,

        container,
        table,
        service,

        showStats = true,
        statsColumns,
        statsProps,

        onRowDetail,
        detailProps,
        defaultSearchParams = {},
        detailModalProps = {},

        children,
      } = inProps;

      const context = useContext(AntDesignProContext);

      const [selectedRows, setSelectedRows] = useState([]);
      const [selectedRowKeys, setSelectedRowKeys] = useState([]);
      const [rowSelectMethod, setRowSelectMethod] = useState<RowSelectMethod>();
      const [detailConfig, setDetailConfig] = useState({
        visible: false,
        record: {},
      });

      const form = useRef<FormInstance | undefined>(undefined);

      const { loading, page } = service || {};

      const {
        rowSelection,
        pagination,
        search = {},
        options,
        toolbar,
        columns = [],
        ...other
      } = table || {};

      const newRowSelection: TableRowSelection = {
        type: "radio",
        ...rowSelection,
        onChange: handleRowSelected,
      };

      const newPagination: TablePaginationConfig = {
        showQuickJumper: true,
        showSizeChanger: true,
        defaultCurrent: 1,
        defaultPageSize: 10,
        size: "small",
        pageSizeOptions: [
          "10",
          "20",
          "30",
          "40",
          "50",
          "60",
          "70",
          "80",
          "90",
          "100",
          "500",
          "1000",
        ],
        hideOnSinglePage: false,
        ...pagination,
      };

      const tableProps: ProTableProps<any, any> = ObjectUtils.deepmerge(other, {
        columns,
        form: {
          submitter: {
            submitButtonProps: {
              loading,
            },
            resetButtonProps: {
              loading,
            },
          },
        },
      });
      if (detailProps) {
        tableProps.columns = [
          ...columns,
          {
            title: " ",
            valueType: "option",
            fixed: "right",
            render: (text, record, index) => [
              <a
                key="detail"
                onClick={() => {
                  function nativeClick() {
                    setDetailConfig({ visible: true, record });
                  }

                  if (onRowDetail) {
                    onRowDetail(record, index, nativeClick);
                  } else {
                    nativeClick();
                  }
                }}
              >
                {"详情"}
              </a>,
            ],
          },
        ];
      }
      if (showStats) {
        tableProps.tableExtraRender = () => (
          <Stats
            dataSource={{ ...page, ...(page as any)?.value }}
            columns={statsColumns}
            {...statsProps}
          />
        );
      }

      // search
      const newSearch = {
        defaultCollapsed: false,
        ...search,
      };

      function handleRowSelected(
        selectedRowKeys,
        selectedRows,
        info: { type: RowSelectMethod }
      ) {
        setSelectedRows(selectedRows);
        setSelectedRowKeys(selectedRowKeys);
        setRowSelectMethod(info.type);

        if (rowSelection && rowSelection.onChange) {
          rowSelection.onChange(selectedRowKeys, selectedRows, info);
        }
      }

      async function handleSearch(
        params: { pageSize: number; current: number } & any,
        sort?,
        filter?
      ) {
        console.log("查询查询", params, sort, filter);
        if (service) {
          await service.query({
            ...defaultSearchParams,
            pageSize: newPagination.defaultPageSize,
            current: newPagination.defaultCurrent,
            ...params,
            page: params.current - 1,
            size: params.pageSize,
          });
          const { page } = service;
          return {
            data: page.content,
            success: true,
            total: page.totalElements,
          };
        }

        return {
          data: [],
          success: true,
          total: 0,
        };
      }

      async function handleReset() {
        const value = form.current?.getFieldsValue();
        await handleSearch({
          pageSize: newPagination.defaultPageSize,
          current: newPagination.defaultCurrent,
          ...value,
        });
      }

      async function handleReload() {
        if (service) {
          await handleSearch(service.searchParams || {});
        }
      }

      return (
        <PageContainer
          style={{ whiteSpace: "nowrap" }}
          onBack={context?.goBack}
          {...container}
        >
          <ProTable
            rowKey="id"
            size="small"
            bordered
            dateFormatter={false}
            scroll={{
              x: true,
              scrollToFirstRowOnChange: true,
            }}
            formRef={form}
            dataSource={page?.content}
            loading={loading}
            request={handleSearch}
            onReset={handleReset}
            pagination={newPagination}
            options={{ fullScreen: true, reload: handleReload, ...options }}
            search={newSearch}
            rowSelection={newRowSelection}
            toolbar={{
              actions: getActionButtons({
                selectedRows,
                setSelectedRows,
                selectedRowKeys,
                setSelectedRowKeys,
                rowSelectMethod,
                onDetail,
                detailUri,
                onAdd,
                addUri,
                addAuthorities,
                onEdit,
                editUri,
                editAuthorities,
                editDisabled,
                onDel,
                delAuthorities,
                service,
                getActionButtonProps,
                location: context,
              }),
              ...toolbar,
            }}
            {...tableProps}
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
    }
  )
);

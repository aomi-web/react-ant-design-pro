import React, { PropsWithChildren, useState } from "react";
import { Progress } from "antd";
import { BetaSchemaForm } from "@ant-design/pro-components";
import type { ParamsType, ProColumns } from "@ant-design/pro-components";

import {
  ResourceReviewStatusText,
  Review,
  ReviewResult,
  ReviewResultText,
  ReviewStatus,
  ReviewStatusText,
} from "@aomi/common-service/ReviewService";

import {
  ActionButtonProps,
  QueryContainer,
  QueryContainerProps,
} from "../QueryContainer";
import {
  column,
  groupFields,
} from "../Form/schema";
import type {ProFormColumnsType} from "@ant-design/pro-components";

export type ReviewContainerProps<T, U extends ParamsType> = {
  /**
   * 审核标题
   */
  reviewTitle?: string;
  onReview?: (formData: any) => Promise<any>;
  /**
   * 审核需要的权限
   */
  reviewAuthorities: Array<string> | boolean;
  /**
   * 自定义展示表格信息
   */
  columns?: ProColumns<T, U>[];

  getColumns?: (defaultColumns: ProColumns<T, U>[]) => ProColumns<T, U>[];

  /**
   * 获取审核表单字段
   * @param review 审核记录信息
   * @param result 审核结果
   * @param defaultFields 默认字段
   */
  getReviewFieldGroups?: (
    review: Review<T>,
    result: ReviewResult,
    defaultFields: Array<ProFormColumnsType>
  ) => Array<ProFormColumnsType>;

  /**
   * 获取动作按钮
   * @param review 审核记录信息
   */
  getActionButtonProps?: (review: Review<T>) => Array<ActionButtonProps>;
} & Omit<QueryContainerProps<T, U>, "getActionButtonProps">;

const COMMON_COLUMNS: Array<ProColumns> = [
  {
    title: "资源状态",
    dataIndex: "resourceReviewStatus",
    valueEnum: ResourceReviewStatusText,
    search: false,
  },
  {
    title: "变更说明",
    dataIndex: "describe",
    search: false,
  },
  {
    title: "审核状态",
    dataIndex: "status",
    valueEnum: ReviewStatusText,
  },
  {
    title: "审核进度",
    dataIndex: "currentReviewUserIndex",
    renderText: (currentReviewUserIndex, { reviewProcess, status, result }) => {
      let proportion = 100;
      let pstatus: any = "active";

      if (reviewProcess && reviewProcess.chain) {
        proportion =
          (currentReviewUserIndex / reviewProcess.chain.length) * 100;
      }

      if (result === ReviewResult.RESOLVE) {
        pstatus = "success";
      } else if (result === ReviewResult.REJECTED) {
        pstatus = "exception";
      } else if (status === ReviewStatus.WAIT) {
        pstatus = "active";
      }

      return (
        <Progress percent={proportion} size={35} type="line" status={pstatus} />
      );
    },
    search: false,
  },
  {
    title: "当前审核人员或角色",
    dataIndex: "reviewProcess",
    renderText: (reviewProcess, data) => {
      if (!reviewProcess) return "-";
      const { chain } = reviewProcess;
      const item = chain[data.currentReviewUserIndex];
      const { describe, role, user } = (item || {}) as any;

      let result = describe;
      if (role) {
        result = `${result}
      可审核角色: ${role.name}`;
      }
      if (user) {
        result = `${result}
      可审核用户: ${user.name}`;
      }

      return result;
    },
    search: false,
  },
  {
    title: "审核结果",
    dataIndex: "result",
    valueEnum: ReviewResultText,
  },
  {
    title: "审核结果说明",
    dataIndex: "resultDescribe",
    search: false,
  },
  {
    title: "创建时间",
    dataIndex: "createAt",
    valueType: "dateTime",
    search: false,
  },
  {
    title: "创建时间",
    dataIndex: "createAtRange",
    valueType: "dateRange",
    hideInTable: true,
  },
];

export const defaultFields: Array<ProFormColumnsType> = [
  column({
    label: "审核结果说明",
    name: "resultDescribe",
    required: true,
  }),
];

export const ReviewContainer: React.FC<
  ReviewContainerProps<any, any>
> = function ReviewContainer(
  props: PropsWithChildren<ReviewContainerProps<any, any>>
) {
  const {
    reviewAuthorities,
    reviewTitle = "",
    onReview,
    columns = [],
    getColumns,
    getReviewFieldGroups,
    getActionButtonProps: argsGetActionButtonProps,
    table: argsTable,
    ...args
  } = props;

  const [state, setState] = useState({
    visible: false,
    result: ReviewResult.REJECTED,
    id: "",
    review: null,
  });

  const table = {
    ...argsTable,
    columns: getColumns
      ? getColumns(COMMON_COLUMNS)
      : columns.concat(COMMON_COLUMNS),
  };

  function getActionButtonProps({ selectedRows }): Array<ActionButtonProps> {
    const review = selectedRows[0];
    let disabled = false;
    if (review) {
      if (review.status === "FINISH") {
        disabled = true;
      }
    } else {
      disabled = true;
    }
    const userButtons = argsGetActionButtonProps
      ? argsGetActionButtonProps(review)
      : [];
    return [
      ...userButtons,
      {
        children: "同意",
        type: "primary",
        disabled,
        onClick: () => {
          setState({
            visible: true,
            result: ReviewResult.RESOLVE,
            id: selectedRows[0].id,
            review,
          });
        },
        authorities: reviewAuthorities,
      },
      {
        children: "拒绝",
        type: "primary",
        disabled,
        danger: true,
        onClick: () => {
          setState({
            visible: true,
            result: ReviewResult.REJECTED,
            id: selectedRows[0].id,
            review,
          });
        },
        authorities: reviewAuthorities,
      },
    ];
  }

  function handleCancel() {
    setState({ ...state, visible: false });
  }

  async function handleOk(formData) {
    if (onReview) {
      await onReview({
        ...formData,
        ...state,
      });
    }
    setState({
      visible: false,
      id: "",
      result: ReviewResult.REJECTED,
      review: null,
    });
  }

  const reviewFieldGroups = getReviewFieldGroups
    ? getReviewFieldGroups(
        state.review as any,
        state.result,
        defaultFields
      ) || []
    : [groupFields(undefined, defaultFields)];

  const reviewColumns = reviewFieldGroups;

  return (
    <QueryContainer
      table={table}
      {...args}
      getActionButtonProps={getActionButtonProps}
    >
      <BetaSchemaForm
        layoutType="ModalForm"
        open={state.visible}
        title={`${reviewTitle ? `${reviewTitle} -` : ""}${
          ReviewResultText[state.result]
        }`}
        modalProps={{
          onCancel: handleCancel,
        }}
        onFinish={handleOk}
        submitter={{
          searchConfig: {
            resetText: "取消",
            submitText: ReviewResultText[state.result],
          },
          submitButtonProps: {},
        }}
        columns={reviewColumns}
      />
    </QueryContainer>
  );
};

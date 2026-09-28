import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { observer } from "mobx-react";

import {
  BetaSchemaForm,
  PageContainer,
  ProCard,
  ProDescriptions,
} from "@ant-design/pro-components";
import type {
  PageContainerProps,
  ProCardProps,
  ProCardTabsProps,
  ProDescriptionsProps,
} from "@ant-design/pro-components";

import { Button, Col, Row, Steps, Typography } from "antd";
import { hasAuthorities, MomentDateUtil, ObjectUtils } from "@aomi/utils";
import { MehOutlined, SmileOutlined } from "@ant-design/icons";
import {
  Review,
  ReviewHistory,
  ReviewResult,
  ReviewResultText,
  ReviewStatus,
  ReviewStatusText,
} from "@aomi/common-service/ReviewService";
import { defaultFields } from "../ReviewContainer/ReviewContainer";
import { AntDesignProContext } from "../provider";
import { Common } from "@aomi/common-service/constants";
import type { ProFormColumnsType } from "@ant-design/pro-components";
import { groupFields } from "../Form/schema";

export type TabPaneProps<T extends Record<string, any>> = {
  tabPaneProps: NonNullable<ProCardTabsProps['items']>[number] & {
    cardProps?: ProCardProps;
  };

  descriptionsProps?: Omit<ProDescriptionsProps<T>, "columns">;
  /**
   * Descriptions 配置 加自定义render配置
   * 自定义渲染整个内容
   *
   * @param options 渲染参数选项
   * @param before 是否是变更前
   * @param after 是否是变更后
   * @param review 审核对象数据
   */
  columnGroups?: Array<
    ProDescriptionsProps<T> & {
      render?: (options: {
        before?: boolean;
        after?: boolean;
        review: T;
      }) => React.ReactNode;
    }
  >;
};

export type ReviewDetailContainerProps<T extends Record<string, any>> = {
  /**
   * 页面容器props
   */
  container?: PageContainerProps;

  /**
   * 是否是从查询页面跳转到该页面
   * 默认为true
   */
  fromQueryContainer?: boolean;

  /**
   * 以tab形式展示数据
   */
  tabs?: ProCardTabsProps;
  /**
   * 初始化激活的tab
   */
  tabActiveKey: string;

  getTabPaneProps: (review: Review<T>) => Array<TabPaneProps<T>>;

  /**
   * 审核需需要的权限
   */
  authorities?: Array<string>;

  /**
   * 处理审核
   * @param reviewHistory
   */
  onReview?: (reviewHistory: ReviewHistory & { id: string }) => Promise<void>;

  review?: Review<T>;

  getReviewFieldGroups?: (
    review: Review<T>,
    result: ReviewResult,
    defaultFields: Array<ProFormColumnsType>
  ) => Array<ProFormColumnsType>;
};

function renderHeader<T>({
  describe,
  histories,
  reviewProcess,
  result,
  status,
}: Review<T>) {
  const first = histories[0];

  const { chain = [] } = reviewProcess || {};

  const items: any[] = [
    {
      status: "finish",
      title: describe,
      content: (
        <div style={{ fontSize: 12 }}>
          <div>{ObjectUtils.getValue(first, "user.name")}</div>
          <div>{first.describe}</div>
          <div>
            {MomentDateUtil.format(first.reviewAt, Common.DATETIME_FORMAT)}
          </div>
        </div>
      ),
    },
    ...chain.map(({ describe, roleName, userName }, index) => {
      const h = histories.length > index + 1 ? histories[index + 1] : null;
      let content;
      let stepStatus;
      if (h) {
        stepStatus = h.result === ReviewResult.RESOLVE ? "finish" : "error";
        content = (
          <div style={{ fontSize: 12 }}>
            <div>{ObjectUtils.getValue(h, "user.name")}</div>
            <div>{`${ReviewResultText[h.result]}原因: ${h.describe}`}</div>
            <div>
              {MomentDateUtil.format(h.reviewAt, Common.DATETIME_FORMAT)}
            </div>
          </div>
        );
      } else {
        stepStatus = result === ReviewResult.REJECTED ? "error" : "wait";
        content = [roleName, userName].join("/");
      }
      return {
        status: stepStatus,
        title: describe,
        content,
        key: index,
      };
    }),
    {
      status:
        status === ReviewStatus.FINISH
          ? result === ReviewResult.RESOLVE
            ? "finish"
            : "error"
          : "wait",
      title: ReviewStatusText.FINISH,
      icon:
        result === ReviewResult.REJECTED ? <MehOutlined /> : <SmileOutlined />,
    },
  ];

  return <Steps items={items} />;
}

/**
 * 审核详情页面
 */
export const ReviewDetailContainer: React.FC<
  ReviewDetailContainerProps<any>
> = observer(function ReviewDetailContainer(
  inProps: PropsWithChildren<ReviewDetailContainerProps<any>>
) {
  const context = useContext(AntDesignProContext);

  const {
    container,

    review,
    onReview,

    tabs,
    tabActiveKey: initTabActiveKey,
    getTabPaneProps,

    authorities,
    fromQueryContainer = true,

    children,
    getReviewFieldGroups,
  } = inProps;

  const [tabActiveKey, setTabActiveKey] = useState(initTabActiveKey);
  const [visible, setVisible] = useState(false);
  const [result, setResult] = useState<ReviewResult>(ReviewResult.REJECTED);

  let reviewData: Review<any>;

  if (fromQueryContainer) {
    const { selectedRows = [] }: any = context?.getParams() || {};
    reviewData = selectedRows[0];
  } else {
    reviewData = review as any;
  }

  useEffect(() => {
    if (!reviewData) {
      console.warn("没有发现详情数据.自动返回上一页");
      context?.goBack();
    }
  }, []);

  if (!reviewData) {
    return <div />;
  }

  const { id, before, after, status } = reviewData;

  async function handleReview(formData) {
    if (onReview) {
      try {
        await onReview({
          ...formData,
          id,
          result,
        });
      } catch (e) {
        console.info("审核出现异常", e);
        return;
      }
    }
    setVisible(false);
  }

  const extra: any = [];
  if (hasAuthorities(authorities) && status !== ReviewStatus.FINISH) {
    extra.push(
      <Button
        key="0"
        danger
        type="primary"
        onClick={() => {
          setVisible(true);
          setResult(ReviewResult.REJECTED);
        }}
      >
        {ReviewResultText.REJECTED}
      </Button>,
      <Button
        key="1"
        type="primary"
        onClick={() => {
          setVisible(true);
          setResult(ReviewResult.RESOLVE);
        }}
      >
        {ReviewResultText.RESOLVE}
      </Button>
    );
  }

  const tabPanes: Array<TabPaneProps<any>> = getTabPaneProps(reviewData);

  const tabItems: any[] = (tabPanes || []).map(
    ({ tabPaneProps, descriptionsProps, columnGroups }, idx) => {
      const {
        tab,
        tabKey,
        key,
        cardProps,
        ...tabProps
      } = (tabPaneProps || {}) as any;

      const content = (
        <Row gutter={30}>
          <Col span={12}>
            {before && (
              <Typography.Title level={4}>{"变更前"}</Typography.Title>
            )}
            {before &&
              columnGroups?.map(({ render, ...item }, index) =>
                render ? (
                  render({ before: true, review: reviewData })
                ) : (
                  <ProDescriptions
                    column={2}
                    dataSource={before}
                    {...descriptionsProps}
                    key={index}
                    {...item}
                    editable={undefined}
                  />
                )
              )}
          </Col>
          <Col span={before ? 12 : 24}>
            <Typography.Title level={4}>{"变更后"}</Typography.Title>
            {after &&
              columnGroups?.map(({ render, ...item }, index) =>
                render ? (
                  render({ after: true, review: reviewData })
                ) : (
                  <ProDescriptions
                    column={before ? 2 : 4}
                    dataSource={after}
                    {...descriptionsProps}
                    key={index}
                    {...item}
                  />
                )
              )}
          </Col>
        </Row>
      );

      return {
        ...tabProps,
        key: key ?? tabKey ?? String(idx),
        label: tab,
        children: cardProps ? <ProCard {...cardProps}>{content}</ProCard> : content,
      };
    }
  );

  const newTabs: ProCardTabsProps = {
    tabPosition: "top",
    ...tabs,
    items: tabItems,
    activeKey: tabActiveKey,
    onChange: setTabActiveKey,
  };

  const reviewFieldGroups = getReviewFieldGroups
    ? getReviewFieldGroups(reviewData, result, defaultFields) || []
    : [groupFields(undefined, defaultFields)];

  const reviewColumns = reviewFieldGroups;

  return (
    <PageContainer
      subTitle={reviewData.describe}
      extra={extra}
      content={renderHeader(reviewData)}
      onBack={context?.goBack}
      {...container}
    >
      <ProCard tabs={newTabs} />
      {children}
      <BetaSchemaForm
        layoutType="ModalForm"
        open={visible}
        title={`执行审核 - ${ReviewResultText[result]}`}
        modalProps={{
          onCancel: () => setVisible(false),
        }}
        onFinish={handleReview}
        submitter={{
          searchConfig: {
            submitText: ReviewResultText[result],
          },
        }}
        columns={reviewColumns}
      />
    </PageContainer>
  );
});

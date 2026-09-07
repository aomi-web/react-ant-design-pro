import React, {PropsWithChildren, useContext, useEffect} from "react";
import {observer} from "mobx-react";
import {PageContainer, ProCard, ProForm, StepsForm} from "@ant-design/pro-components";
import type {PageContainerProps, ProCardProps, ProFormProps, StepFormProps, StepsFormProps} from "@ant-design/pro-components";
import {ObjectUtils} from "@aomi/utils";
import {AntDesignProContext} from "../provider";
import {PageOptions} from "./page";
import {Field, FieldGroup, renderFieldGroup} from "../Form/render";

export type StepsFieldGroup = StepFormProps & {
  fieldGroups?: Array<FieldGroup>;
};

export enum FormType {
  /**
   * 默认表单
   */
  DEFAULT,
  /**
   * 分步表单
   */
  STEP,
}

export type PersistContainerProps = {
  createTitle?: React.ReactNode | false;
  createSubTitle?: React.ReactNode | false;

  editTitle?: React.ReactNode | false;
  editSubTitle?: React.ReactNode | false;

  /**
   * 创建合并的数据删除 id 字段
   */
  createRemoveId?: boolean;

  /**
   * page container props
   */
  container?: PageContainerProps;

  /**
   * 卡片属性
   */
  card?: ProCardProps;

  /**
   * 表单类型
   * 单个表单和分布表单
   */
  formType?: FormType;

  /**
   * 表单props
   */
  formProps?: Omit<ProFormProps, "onFinish"> | Omit<StepsFormProps, "onFinish">;

  /**
   * 默认组件宽度 当grid为false时生效
   */
  defaultWidth?: Field["width"];
  /**
   * 默认组件col配置 当grid为true时生效
   */
  defaultColProps?: Field["colProps"];

  /**
   * 表单字段信息
   */
  fieldGroups?: Array<FieldGroup>;

  /**
   * 分步表单字段信息
   */
  stepsFieldGroups?: Array<StepsFieldGroup>;

  onFinish: (values, pageOptions: PageOptions) => Promise<void>;

  getInitialValues?: (data: { params: any; pageOptions: PageOptions }) => any;

  location?: Location;
};


/**
 * 新增、编辑页面
 */
export const PersistContainer: React.FC<PersistContainerProps> = observer(
  function PersistContainer(inProps: PropsWithChildren<PersistContainerProps>) {
    const context = useContext(AntDesignProContext);

    const {
      createTitle,
      createSubTitle,
      editTitle,
      editSubTitle,

      createRemoveId = true,

      container,
      card,
      formType = FormType.DEFAULT,
      formProps,
      fieldGroups = [],
      stepsFieldGroups = [],
      defaultWidth,
      defaultColProps,

      onFinish,
      getInitialValues,

      children,
    } = inProps;

    const params = context?.getParams();
    const pathname = context?.getPathname() ?? "";

    const pageOptions = {
      created: pathname.endsWith("create"),
      updated: pathname.endsWith("update"),
    };

    useEffect(() => {
      if (pageOptions.updated && !params) {
        console.warn("进入更新页面,但是没有发现需要编辑的数据.自动返回上一页");
        context?.goBack();
      }
    }, [pageOptions, params, context]);

    let initialValues = {};
    if (getInitialValues) {
      initialValues =
        getInitialValues({
          params: params || {},
          pageOptions,
        }) || {};
    } else if (Array.isArray(params?.selectedRows)) {
      initialValues = params.selectedRows[0] || {};
    } else {
      initialValues = params || {};
    }
    if (pageOptions.created && createRemoveId) {
      console.info("新增页面,移除初始化数据中的ID字段");
      Reflect.deleteProperty(initialValues, "id");
    }

    async function handleFinish(values) {
      onFinish &&
        (await onFinish(
          ObjectUtils.deepmerge(initialValues, values),
          pageOptions
        ));
    }

    const title = pageOptions.created ? createTitle : editTitle;
    const subtitle = pageOptions.created ? createSubTitle : editSubTitle;

    return (
      <PageContainer
        title={title}
        subTitle={subtitle}
        onBack={context?.goBack}
        {...container}
      >
        <ProCard variant="borderless" {...card}>
          {formType === FormType.DEFAULT && (
            <ProForm
              scrollToFirstError
              {...(formProps as ProFormProps)}
              onFinish={handleFinish}
              initialValues={initialValues}
            >
              {fieldGroups.map((item, index) =>
                renderFieldGroup(item, index, {
                  pageOptions,
                  grid: (formProps ?? ({} as any)).grid,
                  defaultWidth,
                  defaultColProps,
                })
              )}
            </ProForm>
          )}
          {formType === FormType.STEP && (
            <StepsForm
              {...(formProps as StepsFormProps)}
              onFinish={handleFinish}
            >
              {stepsFieldGroups.map(({ fieldGroups = [], ...item }, index) => (
                <StepsForm.StepForm
                  initialValues={initialValues}
                  {...item}
                  key={index}
                >
                  {fieldGroups.map((group, idx) =>
                    renderFieldGroup(group, idx, {
                      pageOptions,
                      grid: (formProps ?? ({} as any)).grid,
                      defaultWidth,
                      defaultColProps,
                    })
                  )}
                </StepsForm.StepForm>
              ))}
            </StepsForm>
          )}
        </ProCard>
        {children}
      </PageContainer>
    );
  }
);

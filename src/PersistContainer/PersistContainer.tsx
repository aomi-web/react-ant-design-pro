import React, {PropsWithChildren, useContext, useEffect} from "react";
import {observer} from "mobx-react";
import {
  BetaSchemaForm,
  PageContainer,
  ProCard,
} from "@ant-design/pro-components";
import type {
  PageContainerProps,
  ProCardProps,
  ProFormColumnsType,
  ProFormProps,
  StepFormProps,
  StepsFormProps
} from "@ant-design/pro-components";
import {ObjectUtils} from "@aomi/utils";
import {AntDesignProContext} from "../provider";
import type {PageOptions} from "./page";

const FormSchema = BetaSchemaForm as any;

export type StepsFieldGroup = StepFormProps & {
  fieldGroups?: Array<ProFormColumnsType>;
  /**
   * 兼容旧写法，推荐使用 stepProps.title
   */
  title?: React.ReactNode;
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
  defaultWidth?: ProFormColumnsType["width"];
  /**
   * 默认组件col配置 当grid为true时生效
   */
  defaultColProps?: ProFormColumnsType["colProps"];
  /**
   * 默认 colSize，业务列未显式设置时使用
   */
  defaultColSize?: number;

  /**
   * 表单字段信息
   */
  fieldGroups?: Array<ProFormColumnsType>;

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
      defaultWidth = "md",

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

    const applyDefaultValue = (columns: ProFormColumnsType[]) => {
      return columns.map((col) => ({
        ...col,
        width: col.width ?? defaultWidth,
        fieldProps: (form: any, schema: any) => {
          const nextFieldProps =
            typeof col.fieldProps === "function"
              ? col.fieldProps(form, schema)
              : col.fieldProps || {};
          return {
            ...nextFieldProps,
            style: {
              width: col.width ?? defaultWidth,
              ...(nextFieldProps.style || {}),
            },
          };
        },
        ...(Array.isArray(col.columns)
          ? {columns: applyDefaultValue(col.columns)}
          : {}),
      }));
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
            <FormSchema
              scrollToFirstError
              {...(formProps as ProFormProps)}
              onFinish={handleFinish}
              initialValues={initialValues}
              columns={applyDefaultValue(fieldGroups)}
            />
          )}
          {formType === FormType.STEP && (
            <FormSchema
              layoutType="StepsForm"
              {...(formProps as StepsFormProps)}
              onFinish={handleFinish}
              steps={stepsFieldGroups.map(({fieldGroups, title, stepProps, ...item}) => ({
                ...item,
                stepProps: {
                  title,
                  ...stepProps,
                },
                initialValues,
              }))}
              columns={stepsFieldGroups.map(({fieldGroups = []}) =>
                applyDefaultValue(fieldGroups),
              )}
            />
          )}
        </ProCard>
        {children}
      </PageContainer>
    );
  }
);

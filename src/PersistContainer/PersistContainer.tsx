import React, { PropsWithChildren, useContext, useEffect } from "react";
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
  StepsFormProps,
} from "@ant-design/pro-components";
import { AntDesignProContext } from "../provider";
import type { PageOptions } from "./page";

const FormSchema = BetaSchemaForm as any;

export type StepsFieldGroup = StepFormProps & {
  fieldGroups?: Array<ProFormColumnsType>;
  title?: React.ReactNode;
};

export enum FormType {
  DEFAULT,
  STEP,
}

export type PersistContainerProps = {
  createTitle?: React.ReactNode | false;
  createSubTitle?: React.ReactNode | false;
  editTitle?: React.ReactNode | false;
  editSubTitle?: React.ReactNode | false;
  createRemoveId?: boolean;
  container?: PageContainerProps;
  card?: ProCardProps;
  formType?: FormType;
  formProps?:
    | Omit<ProFormProps, "onFinish">
    | Omit<StepsFormProps, "onFinish">;
  defaultWidth?: ProFormColumnsType["width"];
  defaultColProps?: ProFormColumnsType["colProps"];
  defaultColSize?: number;
  fieldGroups?: Array<ProFormColumnsType>;
  stepsFieldGroups?: Array<StepsFieldGroup>;
  onFinish: (values: any, pageOptions: PageOptions) => Promise<void>;
  getInitialValues?: (data: { params: any; pageOptions: PageOptions }) => any;
};

export const PersistContainer: React.FC<
  PropsWithChildren<PersistContainerProps>
> = function PersistContainer(inProps) {
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

  const pageOptions: PageOptions = {
    created: pathname.endsWith("create"),
    updated: pathname.endsWith("update"),
  };

  const applyDefaultValue = (columns: ProFormColumnsType[]) =>
    columns.map((col) => ({
      ...col,
      width: col.width ?? defaultWidth,
      fieldProps: (form: any, schema: any) => {
        const next =
          typeof col.fieldProps === "function"
            ? col.fieldProps(form, schema)
            : col.fieldProps || {};
        return {
          ...next,
          style: {
            width: col.width ?? defaultWidth,
            ...(next.style || {}),
          },
        };
      },
      ...(Array.isArray(col.columns)
        ? { columns: applyDefaultValue(col.columns) }
        : {}),
    }));

  useEffect(() => {
    if (pageOptions.updated && !params) {
      console.warn("进入更新页面,但是没有发现需要编辑的数据.自动返回上一页");
      context?.goBack();
    }
  }, [pageOptions, params, context]);

  let initialValues: any = {};
  if (getInitialValues) {
    initialValues =
      getInitialValues({ params: params || {}, pageOptions }) || {};
  } else if (Array.isArray(params?.selectedRows)) {
    initialValues = params.selectedRows[0] || {};
  } else {
    initialValues = params || {};
  }
  if (pageOptions.created && createRemoveId) {
    Reflect.deleteProperty(initialValues, "id");
  }

  async function handleFinish(values: any) {
    await onFinish({ ...initialValues, ...values }, pageOptions);
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
            steps={stepsFieldGroups.map(
              ({ fieldGroups, title, stepProps, ...item }) => ({
                ...item,
                stepProps: { title, ...stepProps },
                initialValues,
              }),
            )}
            columns={stepsFieldGroups.map(({ fieldGroups = [] }) =>
              applyDefaultValue(fieldGroups),
            )}
          />
        )}
      </ProCard>
      {children}
    </PageContainer>
  );
};

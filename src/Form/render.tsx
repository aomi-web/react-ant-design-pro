import React, {ReactNode} from "react";
import {ListFieldOptions, PageOptions} from "../PersistContainer";
import {ProForm, ProFormDependency, ProFormList} from "@ant-design/pro-components";
import type {GroupProps as ProFormGroupProps, ProFormFieldProps, ProFormListProps, ProFormItemProps} from "@ant-design/pro-components";
import {FormInstance, FormRule} from "antd";
import {renderFormField} from "./renderFormItem";

export type FieldType =
  | ProFormFieldProps["valueType"]
  | "uploadDragger"
  | "uploadButton"
  // 自定义组件, 和valueTypeMap中对应
  | "autoComplete"
  | "transfer"
  | "feeRate";

export type Field = {
  group?: false
  /**
   * 字段类型
   * @deprecated 使用 valueType
   */
  type?: FieldType;
  /**
   * 值类型
   */
  valueType?: FieldType;
  /**
   * 字段名称
   */
  name: string | Array<string | number>;
  /**
   * 依赖的字段名称
   */
  dependencyName?: Array<string | Array<string | number>>;
  /**
   * 数组字段配置
   */
  subFieldGroups?: Array<FieldGroup>;
  /**
   * form list props 当 subFieldGroups 存在时有效
   */
  formListProps?: Omit<ProFormListProps<any>, "name" | "children">;
  /**
   * 编辑时禁用
   */
  editDisabled?: boolean;

  /**
   * 新增时隐藏
   */
  createHidden?: boolean;

  /**
   * 是否允许留空白
   * 默认true
   */
  whitespace?: boolean;

  /**
   * 自定渲染整个字段
   * @param args 当前字段配置信息
   * @param options 页面提供的参数
   */
  renderField?: (args: Field, options: RenderFieldOption) => React.ReactNode;

  /**
   * 渲染带有依赖关系的字段
   * 使用ProFormDependency组件包裹
   * 当使用该值时,dependencyName 字段必填
   * @param args 当前field参数
   * @param pageOptions 页面参数
   * @param dependencyFieldValues 依赖的字段值
   */
  renderDependencyField?: <Values>(
    args: Field,
    dependencyFieldValues: Record<string, any>,
    form: FormInstance<Values>,
    options: RenderFieldOption
  ) => React.ReactNode;

  // /**
  //  * 自定义渲染field的相关属性，提供以后根据属性自动渲染
  //  */
  // proFormFieldProps?: ProFormFieldProps;
} & ProFormItemProps &
  Omit<ProFormFieldProps, "valueType">;

export type FieldGroup = {
  /**
   * 字段信息数据
   */
  fields: Array<Field>;
  /**
   * 自定义渲染group标题
   * @param title 标题dom
   * @param props group ProFormBaseGroupProps
   * @param options
   */
  titleRender?: (
    title: React.ReactNode,
    props: any,
    options: RenderFieldGroupOption
  ) => React.ReactNode;

  /**
   * 默认组件宽度 当grid为false时生效
   */
  defaultWidth?: Field["width"];
  /**
   * 默认组件col配置 当grid为true时生效
   */
  defaultColProps?: Field["colProps"];
} & Omit<ProFormGroupProps, "titleRender">;

export type RenderFieldOption = {
  pageOptions?: PageOptions;
  /**
   * 开启grid布局
   */
  grid?: boolean;
  /**
   * 默认列配置，grid为true时生效
   */
  defaultColProps?: Field["colProps"];
  /**
   * 默认宽度，grid为false时生效
   * 默认值 md
   */
  defaultWidth?: Field["width"];
};

export type RenderFieldGroupOption = RenderFieldOption & {
  listFieldOptions?: ListFieldOptions;
};

/**
 * 渲染一个字段
 * @param args 字段参数
 * @param index 下标
 * @param options 页面参数
 */
export function renderField(
  args: Field,
  index: number,
  options: RenderFieldOption
): Array<ReactNode> | ReactNode {
  const {
    renderDependencyField,
    renderField: renderFieldComponent,
    subFieldGroups,
    dependencyName,
    formListProps,
    createHidden,
    editDisabled,
    whitespace = true,
    rules = [],
    ...field
  } = args;

  const {
    pageOptions = {created: true, updated: false},
    grid = false,

    defaultWidth = "md",
    defaultColProps = {
      span: 8,
    },
  } = options;

  if (createHidden && pageOptions.created) {
    return undefined;
  }

  const newRules: FormRule[] = [...rules];
  if (field.required) {
    newRules.push({required: true, message: `${field.label} 是必填字段`});
  }
  if (whitespace && ["text", "textarea"].includes(field.type || "")) {
    newRules.push({
      whitespace,
    });
  }

  const fieldOptions: Field = {
    disabled: pageOptions.updated && editDisabled,
    rules: newRules,
    ...field,
  };
  if (grid) {
    fieldOptions.fieldProps = {
      style: {width: "100%"},
      ...fieldOptions.fieldProps,
    };
    fieldOptions.colProps = {
      ...defaultColProps,
      ...fieldOptions.colProps,
    };
  } else if (!Reflect.has(fieldOptions, "width")) {
    // 不包含width 字段，设置默认width
    fieldOptions.width = defaultWidth;
  }

  if (renderDependencyField) {
    return (
      <ProFormDependency name={dependencyName || []} key={index} tooltip={field.tooltip}>
        {(dependencyFieldValues, form) =>
          renderDependencyField(
            fieldOptions,
            dependencyFieldValues,
            form,
            options
          )
        }
      </ProFormDependency>
    );
  }

  if (renderFieldComponent) {
    return (
      <React.Fragment key={index}>
        {renderFieldComponent(fieldOptions, options)}
      </React.Fragment>
    );
  }
  if (Array.isArray(subFieldGroups) && subFieldGroups.length > 0) {
    return (
      <ProFormList key={index} label={field.label} tooltip={field.tooltip} {...formListProps}
                   name={field.name || "list"}>
        {(meta, idx, action, count) => {
          return subFieldGroups.map((item, idx) =>
            renderFieldGroup(item, idx, {
              ...options,
              listFieldOptions: {
                meta,
                index: idx,
                action,
                count,
              },
            })
          );
        }}
      </ProFormList>
    );
  }
  return renderFormField(fieldOptions, index)
}

/**
 * 渲染ProForm.Group
 * @param fields 字段
 * @param titleRender
 * @param defaultWidth
 * @param defaultColProps
 * @param props 其他额皮质
 * @param index 组索引
 * @param options 页面选项
 */
export function renderFieldGroup(
  {fields, titleRender, defaultWidth, defaultColProps, ...props}: FieldGroup,
  index: number,
  options: RenderFieldGroupOption
) {
  const newOptions = {
    ...options,
  };
  if (!Reflect.has(newOptions, "defaultWidth")) {
    newOptions.defaultWidth = defaultWidth;
  }
  if (!Reflect.has(newOptions, "defaultColProps")) {
    newOptions.defaultColProps = defaultColProps;
  }

  function titleRenderWrapper(t: any, p: any) {
    return titleRender ? titleRender(t, p, newOptions) : t;
  }

  return (
    <ProForm.Group
      size={16}
      colProps={{span: 6}}
      {...props}
      titleRender={titleRenderWrapper}
      key={index}
    >
      {fields.map((item, idx) => renderField(item, idx, newOptions))}
    </ProForm.Group>
  );
}

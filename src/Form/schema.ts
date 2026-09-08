import type {ProFormColumnsType, ProFormListProps} from "@ant-design/pro-components";
import type {ReactNode} from "react";

type ColumnInput = Omit<ProFormColumnsType, "formItemProps" | "fieldProps"> & {
  label?: ReactNode;
  required?: boolean;
  editDisabled?: boolean;
  createHidden?: boolean;
  type?: ProFormColumnsType["valueType"];
  formItemProps?: ProFormColumnsType["formItemProps"];
  fieldProps?: ProFormColumnsType["fieldProps"];
};

export const isUpdatePage = () =>
  typeof window !== "undefined" && window.location.hash.endsWith("/update");
export const isCreatePage = () =>
  typeof window !== "undefined" && window.location.hash.endsWith("/create");

export function column(input: ColumnInput): ProFormColumnsType {
  if (input.valueType === "dependency" && typeof input.columns === "function") {
    return input as ProFormColumnsType;
  }
  if (Array.isArray((input as any).subFieldGroups)) {
    return formListFields(
      input.name,
      (input as any).subFieldGroups,
      (input as any).formListProps,
    );
  }

  const {
    label,
    required,
    editDisabled,
    createHidden,
    type,
    valueType,
    formItemProps,
    fieldProps,
    name,
    ...rest
  } = input;

  const rules = required
    ? [{required: true, message: `${label || ""} 是必填字段`}]
    : [];

  return {
    ...rest,
    valueType: valueType || type || "text",
    name,
    dataIndex: name,
    title: label,
    formItemProps: (form: any, schema: any) => ({
      ...(typeof formItemProps === "function"
        ? formItemProps(form, schema)
        : formItemProps || {}),
      hidden: createHidden ? isCreatePage() : undefined,
      rules: [...rules, ...((formItemProps as any)?.rules || [])],
    }),
    fieldProps: (form: any, schema: any) => ({
      ...(typeof fieldProps === "function"
        ? fieldProps(form, schema)
        : fieldProps || {}),
      disabled: editDisabled ? isUpdatePage() : undefined,
    }),
  } as ProFormColumnsType;
}

export function group(
  title: ReactNode,
  columns: ProFormColumnsType[],
): ProFormColumnsType {
  return {
    valueType: "group",
    title,
    columns,
  };
}

export function groupFields(
  title: ReactNode,
  fields: any[],
): ProFormColumnsType {
  return group(
    title,
    fields.map((field) => column(field)),
  );
}

export function formList(
  name: ProFormColumnsType["name"],
  columns: ProFormColumnsType[],
  fieldProps?: Omit<ProFormListProps<any>, "name" | "children">,
): ProFormColumnsType {
  return {
    valueType: "formList",
    name,
    dataIndex: name,
    fieldProps,
    columns,
  };
}

export function formListFields(
  name: ProFormColumnsType["name"],
  subFieldGroups: any[],
  fieldProps?: Omit<ProFormListProps<any>, "name" | "children">,
): ProFormColumnsType {
  return formList(
    name,
    subFieldGroups.map((subGroup) =>
      groupFields(subGroup.title, subGroup.fields),
    ),
    fieldProps,
  );
}

export function dependency(
  name: ProFormColumnsType["name"],
  columns: (values: any) => ProFormColumnsType[],
): ProFormColumnsType {
  return {
    valueType: "dependency",
    name,
    columns,
  };
}

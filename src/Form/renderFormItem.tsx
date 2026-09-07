import React from "react";
import {Field} from "./render";
import {
  ProFormField,
  ProFormUploadButton,
  ProFormUploadDragger,
} from "@ant-design/pro-components";
import {InputFeeRate} from "./InputFeeRate/InputFeeRate";

export function renderFormField({
                                  type = "text",
                                  valueType,
                                  fieldProps,
                                  ...props
                                }: Field, key?: any) {
  const vt = valueType || type || "text";
  const newFieldProps = fieldProps ?? {};

  if (vt === "uploadDragger") {
    return (
      <ProFormUploadDragger {...(props as any)} fieldProps={newFieldProps} key={key}/>
    );
  }
  if (vt === "uploadButton") {
    return (
      React.createElement(ProFormUploadButton as any, {
        ...(props as any),
        fieldProps: newFieldProps,
        key,
      })
    );
  }
  if (vt === "transfer") {
    newFieldProps.transferRender =
      newFieldProps.transferRender ?? newFieldProps.render;
  }
  if (vt === "feeRate") {
    props.formItemRender = (_, config) => {
      return <InputFeeRate {...fieldProps} {...config} />;
    };
  }
  if (props.render) {
    console.warn(
      `[render] is deprecated, please use [formItemRender] instead.`,
      props
    );
  }

  return <ProFormField valueType={vt} fieldProps={newFieldProps} {...props} key={key}/>;
}

import React from "react";
import {
  ProFormUploadButton,
  ProFormUploadDragger,
  ProRenderFieldPropsType,
} from "@ant-design/pro-components";
import { AutoComplete, Transfer } from "antd";
import { InputFeeRate } from "./InputFeeRate/InputFeeRate";

/**
 * 值类型映射到对应的渲染组件
 */
export const valueTypeMap: Record<string, ProRenderFieldPropsType> = {
  uploadButton: {
    formItemRender(text, props) {
      return (
        <ProFormUploadButton
          {...(props as any)}
          value={Array.isArray(text) ? text : props.value ?? []}
        />
      );
    },
  },
  uploadDragger: {
    formItemRender(text, props) {
      return (
        <ProFormUploadDragger
          {...(props as any)}
          value={Array.isArray(text) ? text : props.value ?? []}
        />
      );
    },
  },
  autoComplete: {
    formItemRender(text, props) {
      return <AutoComplete value={text} {...props} {...props.fieldProps} />;
    },
  },
  transfer: {
    formItemRender(text, props) {
      return (
        <Transfer
          targetKeys={text}
          {...props}
          {...props.fieldProps}
          render={props.fieldProps.transferRender}
        />
      );
    },
  },
  feeRate: {
    formItemRender(text, props) {
      const { fieldProps, ...rest } = props as any;
      return (
        <InputFeeRate
          {...fieldProps}
          {...rest}
          value={text ?? rest.value}
        />
      );
    },
  },
};

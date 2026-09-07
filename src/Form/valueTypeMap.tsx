import React from "react";
import { ProRenderFieldPropsType } from "@ant-design/pro-components";
import { AutoComplete, Transfer } from "antd";

/**
 * 值类型映射到对应的渲染组件
 */
export const valueTypeMap: Record<string, ProRenderFieldPropsType> = {
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
};

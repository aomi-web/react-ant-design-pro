import React, { useEffect, useState } from "react";
import {
  ProFormUploadButton,
  ProFormUploadDragger,
  ProRenderFieldPropsType,
} from "@ant-design/pro-components";
import { AutoComplete, Transfer } from "antd";
import { InputFeeRate } from "./InputFeeRate/InputFeeRate";

/**
 * 带 request 支持的 AutoComplete:与 select 一致,
 * request 结果(dependencies 联动时用 params 携带依赖值)渲染为下拉选项。
 */
function AutoCompleteField({ text, props }: { text: any; props: any }) {
  const [options, setOptions] = useState<any[] | undefined>(
    props.fieldProps?.options,
  );
  useEffect(() => {
    if (!props.request) return;
    let alive = true;
    Promise.resolve(props.request({ ...(props.params ?? {}) }, props)).then(
      (data: any) => {
        if (alive) setOptions(Array.isArray(data) ? data : data?.data ?? []);
      },
    );
    return () => {
      alive = false;
    };
  }, [props.request, props.params]);
  return (
    <AutoComplete
      value={text}
      {...props}
      {...props.fieldProps}
      options={options}
    />
  );
}

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
      return <AutoCompleteField text={text} props={props} />;
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

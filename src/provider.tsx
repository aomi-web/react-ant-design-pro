import React, { useContext } from "react";
import { ProProvider } from "@ant-design/pro-components";
import { valueTypeMap } from "./Form/valueTypeMap";

/**
 * 框架无关的路由抽象，由宿主应用注入：
 *  - Vite + react-router：navigate / getParams(location.state) / getPathname(location.pathname)
 *  - Next.js App Router：navigate(router.push) / getParams(searchParams) / getPathname(pathname)
 */
export type Location = {
  navigate: (args: { pathname: string; params?: any }) => void;
  goBack: () => void;
  getParams: () => any;
  getPathname: () => string;
};

export type AntDesignProProviderValue = Location;

export const AntDesignProContext =
  React.createContext<AntDesignProProviderValue>({
    navigate() {},
    goBack() {},
    getParams() {},
    getPathname() {
      return "";
    },
  });

export function AntDesignProProvider({
  children,
  ...value
}: React.PropsWithChildren<AntDesignProProviderValue>) {
  const context = useContext(ProProvider);
  if (context) {
    context.valueTypeMap = { ...(context.valueTypeMap || {}), ...valueTypeMap };
  }
  return (
    <AntDesignProContext.Provider value={value}>
      {children}
    </AntDesignProContext.Provider>
  );
}

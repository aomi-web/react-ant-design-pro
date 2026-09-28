import React from "react";

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

export type AntDesignProProviderValue = Location & {
  /**
   * 权限判断，返回 true 表示拥有权限；不提供时默认放行。
   */
  hasAuthorities?: (authorities: string | string[] | boolean) => boolean;
};

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
  return (
    <AntDesignProContext.Provider value={value}>
      {children}
    </AntDesignProContext.Provider>
  );
}

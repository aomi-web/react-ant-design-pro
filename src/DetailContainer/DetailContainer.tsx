import React, { forwardRef } from 'react';
import { observer } from 'mobx-react';

export type DetailContainerProps = {}


export const DetailContainer: React.FC<DetailContainerProps> = observer(forwardRef<any, React.PropsWithChildren<DetailContainerProps>>(function DetailContainer(inProps, ref) {
  return (
    <></>
  );
}));

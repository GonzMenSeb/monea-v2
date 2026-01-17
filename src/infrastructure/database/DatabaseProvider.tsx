import { DatabaseProvider } from '@nozbe/watermelondb/react';

import { database } from './database';

import type { ReactNode, ReactElement } from 'react';

interface Props {
  children: ReactNode;
}

export function WatermelonDBProvider({ children }: Props): ReactElement {
  return <DatabaseProvider database={database}>{children}</DatabaseProvider>;
}

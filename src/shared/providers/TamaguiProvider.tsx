import { TamaguiProvider as TamaguiProviderBase } from 'tamagui';

import config from '../../../tamagui.config';

import type { ReactNode } from 'react';

interface TamaguiProviderProps {
  children: ReactNode;
}

export function TamaguiProvider({ children }: TamaguiProviderProps): React.ReactElement {
  return (
    <TamaguiProviderBase config={config} defaultTheme="dark">
      {children}
    </TamaguiProviderBase>
  );
}

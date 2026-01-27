import { TamaguiProvider as TamaguiProviderBase } from 'tamagui';

import tamaguiConfig from '../../../tamagui.config';

import type { ReactNode } from 'react';

interface TamaguiProviderProps {
  children: ReactNode;
}

export function TamaguiProvider({ children }: TamaguiProviderProps): React.ReactElement {
  return (
    <TamaguiProviderBase config={tamaguiConfig} defaultTheme="dark">
      {children}
    </TamaguiProviderBase>
  );
}

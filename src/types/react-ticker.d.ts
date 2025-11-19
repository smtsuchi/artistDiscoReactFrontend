declare module 'react-ticker' {
  import { FC, ReactNode } from 'react';

  export interface TickerProps {
    mode?: 'chain' | 'smooth' | 'await';
    speed?: number;
    direction?: 'toLeft' | 'toRight';
    children?: (() => ReactNode) | ReactNode;
  }

  const Ticker: FC<TickerProps>;
  export default Ticker;
}

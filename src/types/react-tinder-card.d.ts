declare module 'react-tinder-card' {
  import { FC, ReactNode, Ref } from 'react';

  export interface TinderCardProps {
    ref?: Ref<any>;
    className?: string;
    key?: string | number;
    preventSwipe?: string[];
    onSwipe?: (direction: string, ...args: any[]) => void;
    onCardLeftScreen?: (...args: any[]) => void;
    children?: ReactNode;
  }

  const TinderCard: FC<TinderCardProps>;
  export default TinderCard;
}

import { render, screen } from '@testing-library/react-native';

import {
  Skeleton,
  SkeletonGroup,
  TransactionItemSkeleton,
  TransactionListSkeleton,
  CardSkeleton,
  BalanceCardSkeleton,
  AccountCardSkeleton,
  ChartSkeleton,
  DashboardSkeleton,
} from '../Skeleton';

describe('Skeleton', () => {
  describe('basic rendering', () => {
    it('renders with default text variant', () => {
      render(<Skeleton />);
      expect(screen.getByTestId('skeleton')).toBeTruthy();
    });

    it('renders with text variant', () => {
      render(<Skeleton variant="text" />);
      expect(screen.getByTestId('skeleton')).toBeTruthy();
    });

    it('renders with title variant', () => {
      render(<Skeleton variant="title" />);
      expect(screen.getByTestId('skeleton')).toBeTruthy();
    });

    it('renders with avatar variant', () => {
      render(<Skeleton variant="avatar" />);
      expect(screen.getByTestId('skeleton')).toBeTruthy();
    });

    it('renders with card variant', () => {
      render(<Skeleton variant="card" />);
      expect(screen.getByTestId('skeleton')).toBeTruthy();
    });

    it('renders with button variant', () => {
      render(<Skeleton variant="button" />);
      expect(screen.getByTestId('skeleton')).toBeTruthy();
    });

    it('renders with rectangle variant', () => {
      render(<Skeleton variant="rectangle" />);
      expect(screen.getByTestId('skeleton')).toBeTruthy();
    });
  });

  describe('custom dimensions', () => {
    it('accepts custom width', () => {
      render(<Skeleton width={100} />);
      expect(screen.getByTestId('skeleton')).toBeTruthy();
    });

    it('accepts custom height', () => {
      render(<Skeleton height={50} />);
      expect(screen.getByTestId('skeleton')).toBeTruthy();
    });

    it('accepts custom borderRadius', () => {
      render(<Skeleton borderRadius={8} />);
      expect(screen.getByTestId('skeleton')).toBeTruthy();
    });

    it('accepts percentage width', () => {
      render(<Skeleton width="50%" />);
      expect(screen.getByTestId('skeleton')).toBeTruthy();
    });
  });
});

describe('SkeletonGroup', () => {
  it('renders default number of skeletons', () => {
    render(<SkeletonGroup />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(3);
  });

  it('renders custom number of skeletons', () => {
    render(<SkeletonGroup count={5} />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(5);
  });

  it('renders children when provided', () => {
    render(
      <SkeletonGroup>
        <Skeleton />
        <Skeleton />
      </SkeletonGroup>
    );
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(2);
  });
});

describe('TransactionItemSkeleton', () => {
  it('renders transaction item skeleton', () => {
    render(<TransactionItemSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});

describe('TransactionListSkeleton', () => {
  it('renders default transaction list skeleton with 5 items', () => {
    render(<TransactionListSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });

  it('renders custom number of transaction items', () => {
    render(<TransactionListSkeleton count={3} />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });
});

describe('CardSkeleton', () => {
  it('renders card skeleton', () => {
    render(<CardSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });
});

describe('BalanceCardSkeleton', () => {
  it('renders balance card skeleton', () => {
    render(<BalanceCardSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(4);
  });
});

describe('AccountCardSkeleton', () => {
  it('renders account card skeleton', () => {
    render(<AccountCardSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });
});

describe('ChartSkeleton', () => {
  it('renders chart skeleton', () => {
    render(<ChartSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons).toHaveLength(2);
  });
});

describe('DashboardSkeleton', () => {
  it('renders full dashboard skeleton', () => {
    render(<DashboardSkeleton />);
    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThanOrEqual(10);
  });
});

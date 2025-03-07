import type {
  Amount,
  ApprovedAllowanceAmountResult,
  UnknownOpenActionModuleSettings
} from '@hey/lens';
import type { FC, ReactNode } from 'react';

import AllowanceButton from '@components/Settings/Allowance/Button';
import LoginButton from '@components/Shared/Navbar/LoginButton';
import NoBalanceError from '@components/Shared/NoBalanceError';
import { useApprovedModuleAllowanceAmountQuery } from '@hey/lens';
import { Button, Spinner, WarningMessage } from '@hey/ui';
import cn from '@hey/ui/cn';
import getCurrentSession from '@lib/getCurrentSession';
import { useState } from 'react';
import { formatUnits, isAddress } from 'viem';
import { useAccount, useBalance } from 'wagmi';

interface TipActionProps {
  act: () => void;
  className?: string;
  icon: ReactNode;
  module: UnknownOpenActionModuleSettings;
  moduleAmount?: Amount;
  title: string;
}

const TipAction: FC<TipActionProps> = ({
  act,
  className = '',
  icon,
  module,
  moduleAmount,
  title
}) => {
  const { id: sessionProfileId } = getCurrentSession();
  const isWalletUser = isAddress(sessionProfileId);

  const [isLoading, setIsLoading] = useState(false);
  const [allowed, setAllowed] = useState(true);

  const { address } = useAccount();

  const amount = parseInt(moduleAmount?.value || '0');
  const assetAddress = moduleAmount?.asset?.contract.address;
  const assetDecimals = moduleAmount?.asset?.decimals || 18;

  const { data: allowanceData, loading: allowanceLoading } =
    useApprovedModuleAllowanceAmountQuery({
      onCompleted: ({ approvedModuleAllowanceAmount }) => {
        if (!amount) {
          return;
        }

        const allowedAmount = parseFloat(
          approvedModuleAllowanceAmount[0]?.allowance.value
        );
        setAllowed(allowedAmount > amount);
      },
      skip: !amount || !sessionProfileId || !assetAddress,
      variables: {
        request: {
          currencies: [assetAddress],
          unknownOpenActionModules: [module.contract.address]
        }
      }
    });

  const { data: balanceData } = useBalance({
    address,
    query: { refetchInterval: 2000 },
    token: assetAddress
  });

  let hasAmount = false;
  if (
    balanceData &&
    parseFloat(formatUnits(balanceData.value, assetDecimals)) < amount
  ) {
    hasAmount = false;
  } else {
    hasAmount = true;
  }

  if (!sessionProfileId) {
    return (
      <div className="mt-5">
        <LoginButton title="Login to Collect" />
      </div>
    );
  }

  if (isWalletUser) {
    return null;
  }

  if (allowanceLoading) {
    return (
      <div className={cn('shimmer mt-5 h-[34px] w-28 rounded-lg', className)} />
    );
  }

  if (!allowed) {
    return (
      <AllowanceButton
        allowed={allowed}
        className={cn('mt-5', className)}
        module={
          allowanceData
            ?.approvedModuleAllowanceAmount[0] as ApprovedAllowanceAmountResult
        }
        setAllowed={setAllowed}
        title="Allow open action"
      />
    );
  }

  if (!hasAmount) {
    return (
      <WarningMessage
        className="mt-5 w-full"
        message={<NoBalanceError moduleAmount={moduleAmount as Amount} />}
      />
    );
  }

  return (
    <Button
      className={cn('mt-5', className)}
      disabled={isLoading}
      icon={isLoading ? <Spinner size="xs" /> : icon}
      onClick={act}
    >
      {title}
    </Button>
  );
};

export default TipAction;

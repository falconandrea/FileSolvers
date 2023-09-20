import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";

/**
 * Generates the header component.
 *
 * @returns {JSX.Element} - Returns the JSX element representing the header component.
 */
const Header = () => {
  const { isConnected, address } = useAccount();

  useEffect(() => {}, [isConnected, address]);

  return (
    <header className="flex justify-between items-center p-4 border-b-2 align border-gray-300">
      <Link
        href="/"
        title="Home"
        className="text-2xl pointer text-center font-semibold"
      >
        FileSolvers
      </Link>
      <div className="flex items-center space-x-4">
        <ConnectButton />
      </div>
    </header>
  );
};

export default Header;

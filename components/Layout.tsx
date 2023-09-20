"use client";

import Footer from "./Footer";
import Header from "./Header";
import Head from "next/head";
import Providers from "./Providers";

import { LayoutProps } from "../utils/interfaces-types";

/**
 * Render the Layout component.
 *
 * @param {LayoutProps} children - The children to be rendered inside the Layout component.
 * @return {JSX.Element} The rendered Layout component.
 */
const Layout = ({ children }: LayoutProps) => {
  return (
    <>
      <Providers>
        <Head>
          <title>FileSolvers</title>
          <meta
            content="FileSolvers is a decentralized platform designed to simplify the process of requesting and accessing specific files within the Filecoin Network."
            name="description"
          />
          <link href="/favicon.ico" rel="icon" />
        </Head>
        <Header />
        {children}
        <Footer />
      </Providers>
    </>
  );
};

export default Layout;

"use client";

import { Drawer } from "./../../components/Drawer";
import Header from "./../../components/Header";
import React from "react";
import { ViewModeProvider } from "../../lib/ViewModeContext";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ViewModeProvider>
      <div className="h-screen max-h-screen w-screen flex flex-col">
        <Header />
        <Drawer>{children}</Drawer>
      </div>
    </ViewModeProvider>
  );
}

export default Layout;

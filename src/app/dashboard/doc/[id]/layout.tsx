import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";
import RoomProvider from "../../../../components/RoomProvider";

export default async function DocLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { id: string };
}>) {
  const { id } = params;
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return <RoomProvider roomId={id}>{children}</RoomProvider>;
}



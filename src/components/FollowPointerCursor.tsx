import React from "react";

import Image from "next/image";
import stringToColor from "../lib/stringToColor";
import { FollowPointer } from "./ui/following-pointer";

function FollowPointerCursor({
  x,
  y,
  info,
}: {
  x: number;
  y: number;
  info: {
    name: string;
    email: string;
    avatar: string;
  };
}) {
  return (
    x != 0 &&
    y != 0 && (
      <FollowPointer
        title={<TitleComponent title={info.name} avatar={info.avatar} />}
        x={x}
        y={y}
        color={stringToColor(info.email)}
      ></FollowPointer>
    )
  );
}

const TitleComponent = ({
  title,
  avatar,
}: {
  title: string;
  avatar: string;
}) => (
  <div className="flex items-center space-x-2">
    {avatar ? (
      <Image
        src={avatar}
        height="20"
        width="20"
        alt="thumbnail"
        className="border-2 border-white rounded-full"
      />
    ) : (
      <div className="w-5 h-5 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-white text-[10px] font-bold">
        {title?.[0]?.toUpperCase() ?? "?"}
      </div>
    )}
    <p>{title}</p>
  </div>
);
export default FollowPointerCursor;

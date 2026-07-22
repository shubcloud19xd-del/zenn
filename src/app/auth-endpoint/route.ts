import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import liveblocks from "../../lib/liveblocks";
import { adminDb } from "../../../firebase-admin";


export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    const { room } = await req.json();

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 400 }
      );
    }

    const primaryEmail = user.emailAddresses[0].emailAddress;
    const fullName = user.fullName || "Anonymous";
    const avatar = user.imageUrl || "";

    const session = liveblocks.prepareSession(primaryEmail, {
      userInfo: {
        name: fullName,
        email: primaryEmail,
        avatar: avatar,
      },
    });

    const roomRef = adminDb.collection("users").doc(primaryEmail).collection("rooms").doc(room);
    const roomSnap = await roomRef.get();

    if (roomSnap.exists) {
      session.allow(room, session.FULL_ACCESS);
      const { body, status } = await session.authorize();

      return new Response(body, { status });
    } else {
      return NextResponse.json(
        { message: "You are not in this room" },
        { status: 403 }
      );
    }
  } catch (error: any) {
    console.error("Auth endpoint error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

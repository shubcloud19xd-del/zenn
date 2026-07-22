"use server";

import { adminDb } from "../firebase-admin";
import { auth, currentUser } from "@clerk/nextjs/server"
import liveblocks from "../src/lib/liveblocks";
import { ROLES } from "../src/lib/roles";
import { chunk } from "../src/lib/chunk";
import { revalidatePath } from "next/cache";

export async function createNewDocument() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await currentUser();

  if (!user) throw new Error("User not found");

  const primaryEmail = user.emailAddresses[0].emailAddress;

  // Get all existing document titles to avoid collisions
  const userRooms = await adminDb
    .collection("users")
    .doc(primaryEmail)
    .collection("rooms")
    .get();
  
  const roomIds = userRooms.docs.map(doc => doc.id);
  
  let existingTitles: string[] = [];
  if (roomIds.length > 0) {
    const docRefs = roomIds.map(id => adminDb.collection("documents").doc(id));
    const docs = await adminDb.getAll(...docRefs);
    existingTitles = docs.map(doc => doc.data()?.title).filter(Boolean) as string[];
  }

  let count = 1;
  let title = `Doc ${count}`;

  while (existingTitles.includes(title)) {
    count++;
    title = `Doc ${count}`;
  }

  const docCollectionRef = adminDb.collection("documents");
  const docRef = docCollectionRef.doc();

  await Promise.all([
    docRef.set({ title: title }),
    adminDb
      .collection("users")
      .doc(primaryEmail)
      .collection("rooms")
      .doc(docRef.id)
      .set({
        userId: primaryEmail,
        role: ROLES.OWNER,
        createdAt: new Date(),
        roomId: docRef.id,
      })
  ]);

  return docRef.id;
}


// Delete Document Action

export async function deleteDocument(id: string){
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { success: false, error: "Unauthorized" };

    const user = await currentUser();
    if (!user) return { success: false, error: "User not found" };
    const primaryEmail = user.emailAddresses[0].emailAddress;

    const roomRef = adminDb.collection("users").doc(primaryEmail).collection("rooms").doc(id);
    const roomSnap = await roomRef.get();

    if (!roomSnap.exists) return { success: false, error: "Forbidden: no access to this document." };

    const { role } = roomSnap.data() as { role: string };

    // If the user doesn't own the document, just remove their access to it
    if (role !== ROLES.OWNER) {
      await roomRef.delete();
      revalidatePath("/dashboard");
      return { success: true };
    }

    // Execute all deletion tasks concurrently for maximum speed
    const lbPromise = liveblocks.deleteRoom(id).catch(err => console.log("Liveblocks skipped:", err));
    const docPromise = adminDb.collection("documents").doc(id).delete();
    const ownerRoomPromise = roomRef.delete();

    // Attempt to delete from all users' sidebars concurrently
    const membersPromise = (async () => {
      try {
        const memberRefs = await adminDb.collectionGroup("rooms").where("roomId", '==', id).get();
        const userIds = memberRefs.docs.map((doc) => doc.ref.parent.parent!.id);
        const batchPromises = chunk(userIds, 500).map(group => {
          const batch = adminDb.batch();
          group.forEach((uid) => {
            batch.delete(adminDb.collection("users").doc(uid).collection("rooms").doc(id));
          });
          return batch.commit();
        });
        await Promise.all(batchPromises);
      } catch (indexError) {
        console.log("Collection group query failed (missing index).");
      }
    })();

    await Promise.all([lbPromise, docPromise, ownerRoomPromise, membersPromise]);

    // Invalidate sidebar cache so deleted doc disappears immediately
    revalidatePath("/dashboard");

    return { success: true };

  } catch(error: any) {
    console.log(error);
    return { success: false, error: error.message || "Unknown error" };
  }
}

// Invite Document Action

export async function inviteUserToDocument(roomId:string,email:string){
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");
  
  const user = await currentUser();
  if (!user) throw new Error("User not found");
  const callerEmail = user.emailAddresses[0].emailAddress;

  try{
    const callerRoomRef = adminDb.collection("users").doc(callerEmail).collection("rooms").doc(roomId);
    const callerRoomSnap = await callerRoomRef.get();

    if (!callerRoomSnap.exists) throw new Error("Forbidden: you don't have access to this document.");
    const { role } = callerRoomSnap.data() as { role: string };

    if (role !== ROLES.OWNER && role !== ROLES.EDITOR) {
      throw new Error("Forbidden: you don't have permission to invite users.");
    }

    await adminDb
    .collection("users")
    .doc(email)
    .collection("rooms")
    .doc(roomId)
    .set({
      userId: email,
      role: ROLES.EDITOR,
      createdAt: new Date(),
      roomId,
    });
    return {success:true}

  }catch(error){
    console.log(error);
    return {success:false}
  }
}

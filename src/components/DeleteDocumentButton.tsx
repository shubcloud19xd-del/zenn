import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./../components/ui/dialog";
import { Button } from "./ui/button";
import { deleteDocument } from "../../actions/actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function DeleteDocumentButton({ triggerContent, roomId: propsRoomId }: { triggerContent?: React.ReactNode, roomId?: string }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDeleteClick = async () => {
    const roomId = propsRoomId;
    if (!roomId) {
      toast.error("Could not determine document ID.");
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteDocument(roomId);
      if (result.success) {
        setShowDeleteDialog(false);
        toast.success("Document deleted successfully");
        router.replace("/dashboard");
      } else {
        toast.error((result as any).error || "An error occurred while deleting the document");
        setIsDeleting(false);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "An unexpected error occurred");
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={showDeleteDialog} onOpenChange={(open) => {
      if (!isDeleting) setShowDeleteDialog(open);
    }}>
      <DialogTrigger asChild>
        {triggerContent ? (
          triggerContent
        ) : (
          <div className="p-[1px] relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-lg" />
            <button
              type="button"
              className="px-8 py-2 bg-white dark:bg-black rounded-[6px] relative group transition duration-200 text-gray-900 dark:text-white hover:text-white hover:bg-transparent w-full"
            >
              Delete
            </button>
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Document</DialogTitle>
          <DialogDescription>
            This will permanently delete the document. Are you sure you want to
            delete it?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => setShowDeleteDialog(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isDeleting}
            className="bg-red-500 hover:bg-red-700"
            onClick={handleDeleteClick}
            variant="destructive"
          >
            {isDeleting ? "Deleting..." : "Yes, Delete it"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteDocumentButton;

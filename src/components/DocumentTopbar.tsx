import useOwner from "../lib/useOwner";
import InviteUserButton from "./InviteUserButton";

function DocumentTopbar({ id }: { id: string }) {
  const isOwner = useOwner();

  return (
    <div className="w-full flex justify-end items-center gap-4 relative py-2 px-4">
      <div className="flex items-center gap-4">
        <InviteUserButton />
      </div>
    </div>
  );
}

export default DocumentTopbar;

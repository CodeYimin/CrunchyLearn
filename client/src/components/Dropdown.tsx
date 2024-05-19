import { ReactElement, useState } from "react";

interface DropdownProps {
  name: string;
  content: ReactElement[];
}

export default function Dropdown({
  name,
  content,
}: DropdownProps): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full  border border-primary rounded-md">
      <div
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between btn"
      >
        <p>{name}</p>
        <p className="">{open ? "^" : "V"}</p>
      </div>
      {open && (
        <div className="w-full flex flex-col gap-5 max-h-[50rem] overflow-y-scroll p-3">
          {content}
        </div>
      )}
    </div>
  );
}

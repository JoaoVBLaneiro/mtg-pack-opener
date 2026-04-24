import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
};

export default function Button({
  children,
  onClick,
  disabled = false,
  type = "button",
}: Props) {
  return (
    <button className="primary-btn" type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
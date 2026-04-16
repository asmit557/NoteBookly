import { type ComponentPropsWithoutRef } from "react";

interface SectionProps extends ComponentPropsWithoutRef<"section"> {
  container?: boolean;
  tight?: boolean;
}

export default function Section({
  children,
  container = true,
  tight = false,
  className = "",
  ...props
}: SectionProps) {
  return (
    <section
      className={["relative py-[--spacing-section]", tight && "py-16", className].filter(Boolean).join(" ")}
      {...props}
    >
      {container ? (
        <div className="container">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}

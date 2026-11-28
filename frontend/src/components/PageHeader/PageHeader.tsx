import type { ReactNode } from "react";
import styles from "./PageHeader.module.scss";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  children?: ReactNode; // the controls on the right, e.g. the month control
};

// The top of a signed-in page, as in the designs: the page's h1 with a subtitle under it, and the
// page's controls on the right (below the title on a phone). The controls' place only exists when
// there are controls.
export default function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <header className={styles.heading}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>
      {children && <div className={styles.actions}>{children}</div>}
    </header>
  );
}

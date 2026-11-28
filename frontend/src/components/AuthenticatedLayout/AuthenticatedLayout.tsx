import type { ReactNode } from "react";
import type { CurrentUser } from "../../api/session";
import { useCurrency } from "../../hooks/useCurrency";
import CurrencySelect from "../CurrencySelect/CurrencySelect";
import styles from "./AuthenticatedLayout.module.scss";

type AuthenticatedLayoutProps = {
  user: CurrentUser;
  children: ReactNode;
  showCurrency?: boolean; // the currency dropdown, for the pages whose amounts are converted
};

// The layout of every signed-in page: the one main landmark and a bar with who is signed in. On
// the pages that show converted amounts the bar also has the currency dropdown on its right. Each
// page brings its own h1.
export default function AuthenticatedLayout({
  user,
  children,
  showCurrency = false,
}: AuthenticatedLayoutProps) {
  const { current, choose } = useCurrency();

  return (
    <main className={styles.page}>
      <div className={styles.bar}>
        <p className={styles.user}>Logged in as {user.email}</p>
        {showCurrency && <CurrencySelect current={current} onSelect={choose} />}
      </div>
      {children}
    </main>
  );
}

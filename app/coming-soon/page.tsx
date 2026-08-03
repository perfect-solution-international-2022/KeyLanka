import type { Metadata } from "next";
import Image from "next/image";
import { getMaintenanceSettings } from "@/lib/queries";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "We’ll Be Back Soon",
  description: "Key Lanka is currently undergoing a scheduled update.",
  robots: { index: false, follow: false },
};

export default async function ComingSoonPage() {
  const settings = await getMaintenanceSettings();
  const message =
    settings.message ||
    "Our website is currently undergoing a scheduled update to improve your experience. Thank you for your patience while we make things better.";

  return (
    <main className={`${styles.page} light`}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={`${styles.glow} ${styles.glowOne}`} aria-hidden="true" />
      <div className={`${styles.glow} ${styles.glowTwo}`} aria-hidden="true" />

      <section className={styles.card} aria-labelledby="maintenance-title">
        <div className={styles.logoWrap}>
          <span className={styles.logoRing} aria-hidden="true" />
          <Image
            src="/logo-icon.png"
            alt="Key Lanka"
            width={92}
            height={92}
            priority
            className={styles.logo}
          />
        </div>

        <div className={styles.status} role="status">
          <span className={styles.statusDot} aria-hidden="true" />
          System update in progress
        </div>

        <h1 id="maintenance-title" className={styles.title}>
          We&apos;ll be <span>back soon.</span>
        </h1>

        <p className={styles.message}>{message}</p>

        <div className={styles.progressBlock}>
          <div className={styles.progressTrack} aria-hidden="true">
            <span className={styles.progressBar} />
          </div>
          <p>We are working behind the scenes.</p>
        </div>

        <footer className={styles.footer}>© {new Date().getFullYear()} Key Lanka. All rights reserved.</footer>
      </section>
    </main>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DonatePage from "../donate/page";

export default function NapXuPage() {
  const router = useRouter();

  useEffect(() => {
    // Optionally rewrite/push to /donate
    router.replace("/donate");
  }, [router]);

  return <DonatePage />;
}

"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    crow?: (...args: any[]) => void;
  }
}

function CrowSetupInner() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.crow) {
      setLoaded(true);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_CROW_API_URL || "https://api.usecrow.ai";
    const productId = process.env.NEXT_PUBLIC_CROW_PRODUCT_ID;
    if (!productId) return;

    const script = document.createElement("script");
    script.src = `${apiUrl}/static/crow-widget.js`;
    script.async = true;
    script.dataset.productId = productId;
    script.dataset.apiUrl = apiUrl;
    script.onload = () => setLoaded(true);
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!loaded || !window.crow) return;
    // Step 1 only: just ensure widget script is loaded.
  }, [loaded]);

  return null;
}

export default function CrowSetup() {
  if (process.env.NEXT_PUBLIC_CROW_ENABLED !== "true") return null;
  return <CrowSetupInner />;
}


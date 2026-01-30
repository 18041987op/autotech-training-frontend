import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { AICoachWidget } from "../components/AICoachWidget";

export function AICoachPage() {
  const location = useLocation();

  const moduleIdFromUrl = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("moduleId"); // string | null
  }, [location.search]);

  return <AICoachWidget initialModuleId={moduleIdFromUrl} showHeader={true} />;
}

import React from "react";

export default function RenicCopyright({ align = "center", compact = false, color = "#85684a" }) {
  const year = new Date().getFullYear();

  return (
    <div style={{ textAlign: align, color, fontSize: compact ? 11 : 12, lineHeight: 1.5 }}>
      <div>{`© ${year} Renic Tech. All rights reserved.`}</div>
      <div>Application branding, workflows, and code ownership reserved to Renic Tech.</div>
    </div>
  );
}

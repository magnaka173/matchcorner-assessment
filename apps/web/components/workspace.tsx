"use client";

import { useState } from "react";
import { ConvertPanel } from "./convert-panel";
import { DecodePanel } from "./decode-panel";
import { EncodePanel } from "./encode-panel";
import { WorkspaceHeader } from "./workspace-header";
import { WorkspaceTabs, type WorkspaceTab } from "./workspace-tabs";

export function Workspace() {
  const [tab, setTab] = useState<WorkspaceTab>("decode");

  return (
    <div className="page">
      <WorkspaceHeader />
      <WorkspaceTabs value={tab} onChange={setTab} />
      <div hidden={tab !== "decode"}>
        <DecodePanel />
      </div>
      <div hidden={tab !== "encode"}>
        <EncodePanel />
      </div>
      <div hidden={tab !== "convert"}>
        <ConvertPanel />
      </div>
    </div>
  );
}

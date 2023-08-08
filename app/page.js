"use client";

import LocalMedia from "@/components/LocalMedia";
import StageParticipants from "@/components/StageParticipant";
import MediaControls from "@/components/MediaControls";
import { useRef, useEffect } from "react";
import useStage from "@/hooks/useStage";

import IVSBroadcastClient from "amazon-ivs-web-broadcast";

export default function Home() {
  return (
    <div>
      <div
        id="broadcast-preview"
        className="content"
      >
        <LocalMedia />
        <hr />
        <StageParticipants />
      </div>
      <hr />
      <MediaControls />
    </div>
  );
}

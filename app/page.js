import Image from "next/image";
import styles from "./page.module.css";
import LocalMedia from "@/components/LocalMedia";
import StageParticipants from "@/components/StageParticipant";
import MediaControls from "@/components/MediaControls";
import { useRef } from "react";

import IVSBroadcastClient from "amazon-ivs-web-broadcast";

export default function Home() {
  const canvasRef = useRef();

  const client = IVSBroadcastClient.create({
    // Enter the desired stream configuration
    streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
    // Enter the ingest endpoint from the AWS console or CreateChannel API
    ingestEndpoint: "http://435def77beb6.global-contribute.live-video.net/",
  });
  const streamConfig = IVSBroadcastClient.BASIC_LANDSCAPE;
  console.log("streamConfig", streamConfig);
  console.log("client", client);
  return (
    <div>
      <canvas
        ref={canvasRef}
        style="width: 100%"
      ></canvas>
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

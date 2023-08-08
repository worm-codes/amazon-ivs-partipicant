"use client";
import React, { useContext } from "react";
import { LocalMediaContext } from "../contexts/LocalMediaContext.js";
import { StageContext } from "../contexts/StageContext.js";
import Video from "./Video.js";

export default function LocalVideo() {
  const { participants } = useContext(StageContext);
  const { currentVideoDevice } = useContext(LocalMediaContext);
  console.log("LocalVideo.js: participants: ", participants)
  return (
    <div
      className="column column-40"
      id="local-media"
      style={{ display: "flex" }}
    >
      <div className="participantContainer">
        <Video stageStream={currentVideoDevice} />
      </div>
    </div>
  );
}

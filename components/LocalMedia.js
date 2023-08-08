"use client";
import React, { useEffect, useState, useContext } from "react";
import LocalVideo from "./LocalVideo.js";
import Button from "./Button.js";
import Select from "./Select.js";
import { getDevices } from "../util/mediaDevices.js";
import { LocalMediaContext } from "../contexts/LocalMediaContext.js";
import { StageContext } from "../contexts/StageContext.js";
import { useLocalMedia } from "../hooks/useLocalMedia";

export default function LocalMedia() {
  const cachedStageToken = sessionStorage.getItem("stage-token");
  const cachedScreenshareStageToken = sessionStorage.getItem(
    "stage-screenshare-token"
  );
  const [stageToken, setStageToken] = useState(cachedStageToken || "");
  const [screenshareToken, setScreenshareToken] = useState(
    cachedScreenshareStageToken || ""
  );
  const { audioDevices, videoDevices, updateLocalAudio, updateLocalVideo } =
    useContext(LocalMediaContext);
  const {
    joinStage,
    stageJoined,
    leaveStage,
    screenshareStageJoined,
    publishScreenshare,
    unpublishScreenshare,
  } = useContext(StageContext);

  function joinOrLeaveStage() {
    if (stageJoined) {
      leaveStage();
    } else {
      joinStage(stageToken);
    }
  }

  function toggleScreenshare() {
    if (screenshareStageJoined) {
      unpublishScreenshare();
    } else {
      publishScreenshare(screenshareToken);
    }
  }

  return (
    <div className="row">
      <LocalVideo />
      <div className="column">
        <div
          className="row"
          style={{ marginTop: "2rem" }}
        >
          <div className="column">
            <label htmlFor="token">Token</label>
            <input
              type="text"
              value={stageToken}
              onChange={(e) => setStageToken(e.target.value)}
              id="token"
              name="token"
            />
          </div>
          <div
            className="column"
            style={{ display: "flex", marginTop: "1.5rem" }}
          >
            <Button onClick={joinOrLeaveStage}>
              {stageJoined ? "Leave" : "Join"}
            </Button>
          </div>
        </div>
        <div className="row">
          <div className="column">
            <label htmlFor="screenshare-token">Screenshare Token</label>
            <input
              type="text"
              id="screenshare-token"
              name="screenshare-token"
              value={screenshareToken}
              onChange={(e) => setScreenshareToken(e.target.value)}
            />
          </div>
          <div
            className="column"
            style={{ display: "flex", marginTop: "1.5rem" }}
          >
            <Button onClick={toggleScreenshare}>
              {screenshareStageJoined ? "Stop Screenshare" : "Screenshare"}
            </Button>
          </div>
        </div>
        <div className="row">
          <div className="column">
            <Select
              options={videoDevices}
              onChange={updateLocalVideo}
              title={"Select Webcam"}
            />
          </div>
          <div className="column">
            <Select
              options={audioDevices}
              onChange={updateLocalAudio}
              title={"Select Mic"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useState, useRef, useContext, useEffect } from "react";
import { getScreenshare } from "../util/mediaDevices.js";
import { LocalMediaContext } from "../contexts/LocalMediaContext.js";
import Strategy from "../util/strategy.js";
import {
  Stage,
  StageConnectionState,
  StageEvents,
  SubscribeType,
  LocalStageStream,
  AmazonIVSBroadcastClient,
} from "amazon-ivs-web-broadcast";

export default function useScreenshareStage() {
  const [screenshareStageJoined, setScreenshareStageJoined] = useState(false);
  const { screenshare, updateScreenshare } = useContext(LocalMediaContext);

  const stageRef = useRef(undefined);
  const strategyRef = useRef(
    new Strategy(undefined, undefined, SubscribeType.NONE)
  );

  const strat = {
    shouldPublishParticipant: function (participant) {
      return true;
    },

    shouldSubscribeToParticipant: function (participant) {
      return SubscribeType.NONE;
    },
  };

  useEffect(() => {
    strategyRef.current.updateMedia(undefined, screenshare);
    if (stageRef.current && screenshareStageJoined) {
      stageRef.current.refreshStrategy();
    }
  }, [screenshare]);

  const handleConnectionStateChange = (state) => {
    if (state === StageConnectionState.CONNECTED) {
      setScreenshareStageJoined(true);
    } else if (state === StageConnectionState.DISCONNECTED) {
      setScreenshareStageJoined(false);
    }
  };

  function unpublishScreenshare() {
    if (stageRef.current) {
      stageRef.current.leave();
      updateScreenshare(undefined);
    }
  }

  async function publishScreenshare(token) {
    if (!token) {
      alert("Please enter a token to join a stage");
      return;
    }
    try {
      const screenshareVideo = (await getScreenshare()).getVideoTracks()[0];
      updateScreenshare(screenshareVideo);
    } catch (err) {
      console.log(err);
      // cancelled
      return;
    }
    try {
      const stage = new Stage(token, strategyRef.current);
      stage.on(
        StageEvents.STAGE_CONNECTION_STATE_CHANGED,
        handleConnectionStateChange
      );

      stageRef.current = stage;

      await stageRef.current.join();
      // If we are able to join we know we have a valid token so lets cache it
      sessionStorage.setItem("stage-screenshare-token", token);
    } catch (err) {
      console.error("Error joining screenshare stage", err);
      alert(`Error joining screenshare stage: ${err.message}`);
    }
  }

  return { publishScreenshare, screenshareStageJoined, unpublishScreenshare };
}

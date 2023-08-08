"use client";
import React, { useState, useRef, useContext, useEffect } from "react";
import { LocalMediaContext } from "../contexts/LocalMediaContext.js";
import Strategy from "../util/strategy.js";
import {
  Stage,
  StageConnectionState,
  StageEvents,
  SubscribeType,
} from "amazon-ivs-web-broadcast";
import IVSBroadcastClient, {
  Errors,
  BASIC_LANDSCAPE,
} from "amazon-ivs-web-broadcast";

export default function useStage(canvasRef = null, client = null) {
  const [stageJoined, setStageJoined] = useState(false);
  const [participants, setParticipants] = useState(new Map());
  const [localParticipant, setLocalParticipant] = useState({});
  const { currentVideoDevice, currentAudioDevice } =
    useContext(LocalMediaContext);

  const stageRef = useRef(undefined);
  const strategyRef = useRef(
    new Strategy(currentAudioDevice, currentVideoDevice)
  );

  const refreshVideoPositions = () =>
    participants.forEach((participant, index) =>
      client.updateVideoDeviceComposition(`video-${participant.id}`, {
        index: 0,
        width: streamConfig.maxResolution.width / participants.length,
        x: index * (streamConfig.maxResolution.width / participants.length),
      })
    );

  useEffect(() => {
    strategyRef.current.updateMedia(currentAudioDevice, currentVideoDevice);
    if (stageRef.current && stageJoined) {
      stageRef.current.refreshStrategy();
    }
  }, [currentAudioDevice, currentVideoDevice]);

  const handleParticipantJoin = (participantInfo) => {
    if (isLocalParticipant(participantInfo)) {
      setLocalParticipant(participantInfo);
    } else {
      const participant = createParticipant(participantInfo);
      // NOTE: we must make a new map so react picks up the state change
      setParticipants(new Map(participants.set(participant.id, participant)));
    }
  };

  const handleParticipantLeave = (participantInfo) => {
    if (isLocalParticipant(participantInfo)) {
      setLocalParticipant({});
    } else {
      if (participants.delete(participantInfo.id)) {
        setParticipants(new Map(participants));
      }
    }
  };

  const handleMediaAdded = (participantInfo, streams) => {
    if (!isLocalParticipant(participantInfo)) {
      const { id } = participantInfo;
      let participant = participants.get(id);
      participant = {
        ...participant,
        streams: [...streams, ...participant.streams],
      };
      setParticipants(new Map(participants.set(id, participant)));
    }
    if (client) {
      refreshVideoPositions();
    }
  };

  const handleMediaRemoved = (participantInfo, streams) => {
    if (!isLocalParticipant(participantInfo)) {
      const { id } = participantInfo;
      let participant = participants.get(id);
      const newStreams = participant.streams.filter(
        (existingStream) =>
          !streams.find(
            (removedStream) => existingStream.id === removedStream.id
          )
      );
      participant = { ...participant, streams: newStreams };
      setParticipants(new Map(participants.set(id, participant)));
    }
    if (client) {
      refreshVideoPositions();
    }
  };

  const handleParticipantMuteChange = (participantInfo, stream) => {
    if (!isLocalParticipant(participantInfo)) {
      const { id } = participantInfo;
      let participant = participants.get(id);
      participant = { ...participant, ...participantInfo };
      setParticipants(new Map(participants.set(id, participant)));
    }
  };

  const handleConnectionStateChange = async (state) => {
    if (state === StageConnectionState.CONNECTED) {
      setStageJoined(true);
    } else if (state === StageConnectionState.DISCONNECTED) {
      setStageJoined(false);
    }
  };

  function leaveStage() {
    if (stageRef.current) {
      stageRef.current.leave();
    }
  }

  // const initBroadcastClient = async () => {

  //   const previewEl = document.getElementById("broadcast-preview");
  //   broadcastClient.current.attachPreview(previewEl);

  //   const bgImage = new Image();
  //   bgImage.src = "/images/video-image.png";
  //   broadcastClient.current.addImageSource(bgImage, "bg-image", { index: 0 });
  // };

  async function joinStage(token) {
    console.log(token);
    if (!token) {
      alert("Please enter a token to join a stage");
      return;
    }
    try {
      const stage = new Stage(token, strategyRef.current);
      if (client) {
        console.log("client", client);
        client.enableVideo();
        client.enableAudio();
        if (canvasRef.current) {
          client.attachPreview(canvasRef.current);
        }
      }

      stage.on(
        StageEvents.STAGE_CONNECTION_STATE_CHANGED,
        handleConnectionStateChange
      );
      stage.on(StageEvents.STAGE_PARTICIPANT_JOINED, handleParticipantJoin);
      stage.on(StageEvents.STAGE_PARTICIPANT_LEFT, handleParticipantLeave);
      stage.on(StageEvents.STAGE_PARTICIPANT_STREAMS_ADDED, handleMediaAdded);
      stage.on(
        StageEvents.STAGE_PARTICIPANT_STREAMS_REMOVED,
        handleMediaRemoved
      );
      stage.on(
        StageEvents.STAGE_STREAM_MUTE_CHANGED,
        handleParticipantMuteChange
      );

      stageRef.current = stage;

      await stageRef.current.join();

      // If we are able to join we know we have a valid token so lets cache it
      sessionStorage.setItem("stage-token", token);
    } catch (err) {
      console.error("Error joining stage", err);
      alert(`Error joining stage: ${err.message}`);
    }
  }

  return { joinStage, stageJoined, leaveStage, participants };
}

function createParticipant(participantInfo) {
  return {
    ...participantInfo,
    streams: [],
  };
}

function isLocalParticipant(info) {
  return info.isLocal;
}

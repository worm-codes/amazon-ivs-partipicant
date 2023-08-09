"use client";
import React, { useState, useRef, useContext, useEffect } from "react";
import { LocalMediaContext } from "../contexts/LocalMediaContext.js";
import Strategy from "../util/strategy.js";
import IVSBroadcastClient, {
  Stage,
  StageConnectionState,
  StageEvents,
  SubscribeType,
} from "amazon-ivs-web-broadcast";

export default function useStage() {
  const client = IVSBroadcastClient.create({
    // Enter the desired stream configuration
    streamConfig: IVSBroadcastClient.BASIC_LANDSCAPE,
    // Enter the ingest endpoint from the AWS console or CreateChannel API
    ingestEndpoint: "435def77beb6.global-contribute.live-video.net",
  });
  const streamConfig = IVSBroadcastClient.BASIC_LANDSCAPE;
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

  const handleMediaAdded = async (participantInfo, streams) => {
    const { id } = participantInfo;
    let participant = participants.get(id);
    participant = {
      ...participant,
      streams: [...streams, ...participant?.streams],
    };
    setParticipants(new Map(participants.set(id, participant)));
    await Promise.all([
      ...streams
        .filter((stream) => stream.streamType === StreamType.VIDEO)
        .map((stream) =>
          client.addVideoInputDevice(
            new MediaStream([stream.mediaStreamTrack]),
            `video-${participant.id}`,
            {
              index: 0,
              width: streamConfig.maxResolution.width / participants.length,
              x:
                (participants.length - 1) *
                (streamConfig.maxResolution.width / participants.length),
            }
          )
        ),
      ...streams
        .filter((stream) => stream.streamType === StreamType.AUDIO)
        .map((stream) =>
          client.addAudioInputDevice(
            new MediaStream([stream.mediaStreamTrack]),
            `audio-${participant.id}`
          )
        ),
    ]);
    refreshVideoPositions();
  };

  const handleMediaRemoved = (participantInfo, streams) => {
    if (!isLocalParticipant(participantInfo)) {
      const { id } = participantInfo;
      let participant = participants.get(id);
      const newStreams = participant?.streams.filter(
        (existingStream) =>
          !streams.find(
            (removedStream) => existingStream.id === removedStream.id
          )
      );
      participant = { ...participant, streams: newStreams };
      setParticipants(new Map(participants.set(id, participant)));
      client.removeVideoInputDevice(`video-${participant.id}`);
      client.removeAudioInputDevice(`audio-${participant.id}`);
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

  const handleConnectionStateChange = (state) => {
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

  async function joinStage(token) {
    if (!token) {
      alert("Please enter a token to join a stage");
      return;
    }
    try {
      const stage = new Stage(token, strategyRef.current);
      client.enableVideo();
      client.enableAudio();
      
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

"use client";
import React, { useContext } from "react";
import { StageContext } from "../contexts/StageContext.js";
import Participant from "./Participant.js";

export default function StageParticipants() {
  const { participants } = useContext(StageContext);
  console.log(participants);
  return (
    <div>
      {[...participants.keys()].map((key) => {
        return (
          <Participant
            key={key}
            {...participants.get(key)}
          />
        );
      })}
    </div>
  );
}

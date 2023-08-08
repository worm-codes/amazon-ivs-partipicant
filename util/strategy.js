import { SubscribeType } from "amazon-ivs-web-broadcast";

export default class Strategy {
  _videoStream = undefined;
  _audioStream = undefined;
  _subscribeType = SubscribeType.NONE;

  constructor(
    audioStream,
    videoStream,
    subscribeType = SubscribeType.AUDIO_VIDEO
  ) {
    this._videoStream = videoStream;
    this._audioStream = audioStream;
    this._subscribeType = subscribeType;
  }

  updateMedia(audioStream, videoStream) {
    this._audioStream = audioStream;
    this._videoStream = videoStream;
  }

  stageStreamsToPublish() {
    const streams = [];
    if (this._videoStream) {
      streams.push(this._videoStream);
    }

    if (this._audioStream) {
      streams.push(this._audioStream);
    }

    return streams;
  }

  shouldPublishParticipant(participantInfo) {
    console.log("shouldPublishParticipant", participantInfo)
    return true;
  }

  shouldSubscribeToParticipant(participantInfo) {
    return this._subscribeType;
  }
}

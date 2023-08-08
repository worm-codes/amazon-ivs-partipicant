export async function initializeDeviceSelect() {
  const videoSelectEl = document.getElementById("video-devices");

  videoSelectEl.disabled = false;
  const { videoDevices, audioDevices } = await getDevices();
  videoDevices.forEach((device, index) => {
    videoSelectEl.options[index] = new Option(device.label, device.deviceId);
  });

  const audioSelectEl = document.getElementById("audio-devices");

  audioSelectEl.disabled = false;
  audioDevices.forEach((device, index) => {
    audioSelectEl.options[index] = new Option(device.label, device.deviceId);
  });
}

export async function getDevices() {
  // The following line prevents issues on Safari/FF WRT to device selects
  // and ensures the device labels are not blank
  await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter((d) => d.kind === "videoinput");
  if (!videoDevices.length) {
    setError("No video devices found.");
  }
  const audioDevices = devices.filter((d) => d.kind === "audioinput");
  if (!audioDevices.length) {
    setError("No audio devices found.");
  }

  return { videoDevices, audioDevices };
}

export async function getCamera(deviceId) {
  let media;
  const videoConstraints = {
    deviceId: deviceId ? { exact: deviceId } : null,
  };
  media = await navigator.mediaDevices.getUserMedia({
    video: videoConstraints,
    audio: false,
  });
  return media.getTracks()[0];
}

export async function getMic(deviceId) {
  let media;
  const audioConstraints = {
    deviceId: deviceId ? { exact: deviceId } : null,
  };
  media = await navigator.mediaDevices.getUserMedia({
    video: false,
    audio: audioConstraints,
  });
  return media.getTracks()[0];
}

export async function getScreenshare() {
  // TODO: Constraints?
  return navigator.mediaDevices.getDisplayMedia();
}

(function () {
  async function startVideo(video, status) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (status) status.textContent = "摄像头不可用，已进入模拟佩戴模式";
      return null;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      video.srcObject = stream;
      await video.play();
      if (status) status.textContent = "摄像头已开启，正在进入戴面入场";
      return stream;
    } catch (error) {
      if (status) status.textContent = "摄像头未开启，已进入模拟佩戴模式";
      return null;
    }
  }

  window.NuoCamera = { startVideo };
})();

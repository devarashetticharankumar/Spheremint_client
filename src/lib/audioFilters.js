export const applyAudioFilter = async (originalBlob, filterType) => {
    if (!filterType || filterType === "normal") return originalBlob;

    const arrayBuffer = await originalBlob.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Decode the audio
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Create OfflineAudioContext to render the processed audio
    // Duration might change for pitch shifting (resampling approach)
    let outputDuration = audioBuffer.duration;
    if (filterType === "kid") outputDuration = audioBuffer.duration / 1.5;
    if (filterType === "deep") outputDuration = audioBuffer.duration / 0.75;

    // Safety margin
    const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        outputDuration * audioBuffer.sampleRate, // Length in samples
        audioBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    let destination = offlineCtx.destination;

    // Apply Filters
    if (filterType === "kid") {
        // Simple resampling pitch shift (speed up)
        source.playbackRate.value = 1.5;
        source.connect(destination);
    }
    else if (filterType === "deep") {
        // Simple resampling pitch shift (slow down)
        source.playbackRate.value = 0.75;
        source.connect(destination);
    }
    else if (filterType === "robot") {
        // Ring Modulator
        const oscillator = offlineCtx.createOscillator();
        oscillator.type = 'square';
        oscillator.frequency.value = 50; // 50Hz metallic vibration

        const gainNode = offlineCtx.createGain();
        gainNode.gain.value = 0; // modulated by oscillator

        // Connect oscillator to gain.gain
        // But in WebAudio we need a constant source or a different setup for ring mod.
        // Standard Ring Mod: Source * Carrier

        // Setup: Source -> GainNode -> Destination
        // Oscillator -> GainNode.gain

        // We need to shift the oscillator to 0-1 or -1 to 1?
        // Simple Ring Mod uses -1 to 1, which effectively multiplies amplitude.

        const oscGain = offlineCtx.createGain();
        oscGain.gain.value = 1.0;

        oscillator.connect(gainNode.gain);

        source.connect(gainNode);
        gainNode.connect(destination);

        oscillator.start();
    }
    else if (filterType === "masked") {
        // Distortion + Bandpass (Walkie Talkie / Witness Protection)
        const distortion = offlineCtx.createWaveShaper();
        distortion.curve = makeDistortionCurve(400); // 400 is amount

        const lowpass = offlineCtx.createBiquadFilter();
        lowpass.type = "lowpass";
        lowpass.frequency.value = 2000;

        const highpass = offlineCtx.createBiquadFilter();
        highpass.type = "highpass";
        highpass.frequency.value = 500;

        const compressor = offlineCtx.createDynamicsCompressor();

        source.connect(distortion);
        distortion.connect(lowpass);
        lowpass.connect(highpass);
        highpass.connect(compressor);
        compressor.connect(destination);
    }
    else {
        source.connect(destination);
    }

    source.start();

    // Render
    const renderedBuffer = await offlineCtx.startRendering();

    // Convert AudioBuffer to Wav Blob
    return bufferToWave(renderedBuffer, renderedBuffer.length);
};

// Helper: Create Distortion Curve
function makeDistortionCurve(amount) {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
}

// Helper: Convert AudioBuffer to Wav Blob
// Source adaptation from standard implementations
function bufferToWave(abuffer, len) {
    let numOfChan = abuffer.numberOfChannels;
    let length = len * numOfChan * 2 + 44;
    let buffer = new ArrayBuffer(length);
    let view = new DataView(buffer);
    let channels = [];
    let i;
    let pos = 0;
    let offset = 0;

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"

    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit (hardcoded in this loop)

    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

    // write interleaved data
    for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {
            // interleave channels
            let sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true); // write 16-bit sample
            pos += 2;
        }
        offset++; // next source sample
    }

    return new Blob([buffer], { type: "audio/wav" });

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

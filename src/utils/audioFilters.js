export const applyVoiceDistortion = async (audioBlob) => {
    console.log("AudioFilter: Starting distortion...");
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = await audioBlob.arrayBuffer();
        console.log("AudioFilter: Decoded array buffer", arrayBuffer.byteLength);

        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log("AudioFilter: AudioBuffer created", audioBuffer.duration, "s");

        // Calculate new length to accommodate the slower playback (0.85x speed)
        // If we don't extend this, the end will be cut off.
        const newLength = Math.ceil(audioBuffer.length / 0.85);

        // Create OfflineAudioContext to render the effect faster than real-time
        const offlineContext = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            newLength,
            audioBuffer.sampleRate
        );

        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;

        // Pitch Shift Effect (Deep Voice)
        source.playbackRate.value = 0.85;

        // Add a bit of reverb/echo for mystery
        const delay = offlineContext.createDelay();
        delay.delayTime.value = 0.1; // 100ms echo

        const gain = offlineContext.createGain();
        gain.gain.value = 0.3;

        // Graph: Source -> Destination
        //       Source -> Delay -> Gain -> Destination
        source.connect(offlineContext.destination);
        source.connect(delay);
        delay.connect(gain);
        gain.connect(offlineContext.destination);

        source.start(0);

        const renderedBuffer = await offlineContext.startRendering();
        console.log("AudioFilter: Offline rendering complete");

        // Convert AudioBuffer back to Wav Blob
        // Pass renderedBuffer.length, not original length
        return bufferToWave(renderedBuffer, renderedBuffer.length);
    } catch (err) {
        console.error("Audio processing failed", err);
        return audioBlob; // Return original if fail
    }
};

// Simple WAV encoder helper
function bufferToWave(abuffer, len) {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [],
        i, sample,
        offset = 0,
        pos = 0;

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded in this dem)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for (i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while (pos < length) {
        for (i = 0; i < numOfChan; i++) {             // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true);          // write 16-bit sample
            pos += 2;
        }
        offset++                                     // next source sample
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

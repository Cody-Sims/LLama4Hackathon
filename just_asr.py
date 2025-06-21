"""
run:  python asr_probe.py Video_Clip_Generation_Complete.mp4
You should see at least these two lines within one second:

[ASR] opening …
[ffmpeg] sent 1s
"""

import asyncio, ffmpeg, sys, time
from amazon_transcribe.client import TranscribeStreamingClient
from botocore.exceptions import BotoCoreError, NoCredentialsError

TIMEOUT_SEC = 8          # bail out fast if nothing comes back

async def asr(path):
    print("[ASR] opening …", flush=True)
    try:
        ts = TranscribeStreamingClient(region="us-east-1")
        stream = await ts.start_stream_transcription(
            language_code="en-US",
            media_encoding="pcm",
            media_sample_rate_hz=16000,
            enable_partial_results_stabilization=True,
            partial_results_stability="high",
        )
    except (BotoCoreError, NoCredentialsError) as e:
        print("AWS credential / region problem →", e)
        return
    print("[ASR] stream open ✔", flush=True)

    async def sender():
        sent = 0
        proc = (
            ffmpeg
            .input(path)
            .output(
                "pipe:",
                format="s16le",
                acodec="pcm_s16le",
                ac=1,
                ar="16000",
            )
            .run_async(pipe_stdout=True, quiet=True)
        )
        while chunk := proc.stdout.read(32000):  # 1-second chunk
            sent += 1
            if sent % 1 == 0:
                print(f"[ffmpeg] sent {sent}s", flush=True)
            await stream.input_stream.send_audio_event(audio_chunk=chunk)
        await stream.input_stream.end_stream()
        print("[ffmpeg] reached end of audio stream", flush=True)

    async def receiver():
        print("[ASR] waiting for events …", flush=True)
        async for event in asyncio.wait_for(
            stream.output_stream.__aiter__().__anext__(), TIMEOUT_SEC
        ):
            for res in event.transcript.results:
                if not res.is_partial:
                    txt = res.alternatives[0].transcript
                    print(f"{res.start_time:5.2f}s  {txt}", flush=True)

    try:
        await asyncio.gather(sender(), receiver())
    except asyncio.TimeoutError:
        print(f"No ASR events in {TIMEOUT_SEC}s → likely no speech", flush=True)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Usage: python asr_probe.py <video_or_audio_file>")
    asyncio.run(asr(sys.argv[1]))

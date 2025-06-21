import asyncio, ffmpeg, json, time, boto3, sys
from amazon_transcribe.client import TranscribeStreamingClient
from amazon_transcribe.model import TranscriptResultStream
from sagemaker.serializers import IdentitySerializer as BytesSerializer
from sagemaker.deserializers import JSONDeserializer

# ---------- CONFIG ----------------------------------------------------------
AER_ENDPOINT   = "<PASTE-YOUR-ENDPOINT-NAME>"
PCM_RATE       = 16_000
CHUNK_SEC      = 0.25                      # 0.25-s chunks ≈ 8 kB
THRESH, HOLD   = 0.35, 0.40               # confidence / debounce
LABELS         = json.load(open("yamnet_class_map.json"))   # idx→label
# Only keep “interesting” classes
KEEP           = {"Rain", "Walking", "Footsteps", "Breathing", "Applause"}
# ---------------------------------------------------------------------------

rt = boto3.client("sagemaker-runtime")
ts = TranscribeStreamingClient(region="us-east-1")          # adjust if needed

async def pcm_chunks(path):
    buf = int(PCM_RATE*2*CHUNK_SEC)
    proc = (ffmpeg.input(path)
                   .output("pipe:", format="s16le", acodec="pcm_s16le",
                           ac=1, ar=str(PCM_RATE))
                   .run_async(pipe_stdout=True, quiet=True))
    idx = 0
    while chunk := proc.stdout.read(buf):
        idx += 1
        if idx % 20 == 0:
            print(f"[debug] sent {idx} chunks")
        yield chunk
    print("[debug] reached end of audio stream")

def call_aer(chunk: bytes):
    resp = rt.invoke_endpoint(EndpointName=AER_ENDPOINT,
                              ContentType="application/octet-stream",
                              Body=chunk)
    scores = json.loads(resp["Body"].read())["predictions"][0]
    idx = max(range(len(scores)), key=scores.__getitem__)
    return idx, scores[idx]

async def transcribe_and_tag(path):
    print("[debug] opening ASR stream …")
    stream: TranscriptResultStream = await ts.start_stream_transcription(
        language_code              = "en-US",
        media_encoding             = "pcm",
        media_sample_rate_hz       = PCM_RATE,
        enable_partial_results_stabilization = True,
        partial_results_stability  = "high",
    )
    print("[debug] ASR stream opened")

    aer_q = asyncio.Queue()

    async def sender():
        async for chunk in pcm_chunks(path):
            await asyncio.gather(
                stream.input_stream.send_audio_event(audio_chunk=chunk),
                aer_worker(chunk))
        await stream.input_stream.end_stream()

    async def aer_worker(chunk):
        loop = asyncio.get_running_loop()
        idx, conf = await loop.run_in_executor(None, call_aer, chunk)
        await aer_q.put((idx, conf, time.time()))

    # state for debouncing sound events
    cur_evt, evt_start = None, 0
    captions = []

    async def merger():
        nonlocal cur_evt, evt_start
        while True:
            done, _ = await asyncio.wait(
                [stream.output_stream.__anext__(), aer_q.get()],
                return_when=asyncio.FIRST_COMPLETED)

            for fut in done:
                item = fut.result()

                # ---------- ASR ----------
                if hasattr(item, "transcript"):
                    for res in item.transcript.results:
                        if res.is_partial:          # ignore partials
                            continue
                        txt   = res.alternatives[0].transcript
                        start = res.start_time
                        end   = res.end_time
                        if cur_evt:                # overlap → prefix tag
                            txt = f"[{cur_evt.upper()}] " + txt
                        captions.append((start, end, txt))
                        print(f"{start:7.2f}s  {txt}")

                # ---------- AER ----------
                else:
                    idx, conf, ts = item
                    label = LABELS[str(idx)]
                    if label not in KEEP:
                        continue
                    if conf > THRESH:
                        if cur_evt is None:
                            cur_evt, evt_start = label, ts
                    else:
                        if cur_evt and ts - evt_start >= HOLD:
                            captions.append((evt_start, ts,
                                             f"[{cur_evt.upper()}]"))
                            cur_evt = None

            if stream.output_stream.at_eof() and aer_q.empty():
                break
        return captions

    caps = await asyncio.gather(sender(), merger())
    write_srt(caps[1], "out.srt")

def write_srt(items, path):
    with open(path, "w") as f:
        for i,(s,e,txt) in enumerate(items,1):
            f.write(f"{i}\n{t(s)} --> {t(e)}\n{txt}\n\n")
def t(sec):                                  # 123.456 → 00:02:03,456
    ms   = int((sec - int(sec))*1000)
    h,m,s = time.gmtime(sec)[3:6]
    return f"{h:02}:{m:02}:{s:02},{ms:03}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("Usage: python realtime_sdh.py myclip.mp4")
    asyncio.run(transcribe_and_tag(sys.argv[1]))

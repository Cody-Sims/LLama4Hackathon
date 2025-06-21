import tensorflow as tf, numpy as np, soundfile as sf
yamnet = tf.saved_model.load('model/1')
waveform, sr = sf.read('some_audio.wav')
assert sr == 16000, "YAMNet expects 16-kHz audio"
scores, *_ = yamnet(waveform.reshape(1, -1))
print("Top class:", np.argmax(scores.numpy()))
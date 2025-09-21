# Gesture Recognition — Inference on MCU (Arduino Nano 33 BLE Sense)

This folder contains the Arduino sketch that runs your trained TensorFlow Lite model on-device to recognize IMU gestures in real time.

Folders
- `Arduino_TensorFlowLite.zip` — TensorFlow Lite for Microcontrollers library (install manually)
- `gesture_recognition_inference/` — Arduino sketch and model files
  - `gesture_recognition.ino`
  - `gesture_recognition_model_data.h`
  - `gesture_recognition_model_data.cpp` (generated from training)

---

## 1) Install Arduino_TensorFlowLite library (manual)
Install the included library ZIP into Arduino IDE:
1) Open Arduino IDE → Sketch → Include Library → Add .ZIP Library…
2) Select: `03_Interence_on_MCU/Arduino_TensorFlowLite.zip`
3) Confirm the library appears under Sketch → Include Library.

Also install the IMU library (if not already):
- Tools → Manage Libraries → search and install “Arduino_LSM9DS1”.

Make sure the board package is installed:
- Tools → Board Manager → install “Arduino Mbed OS Nano Boards”.

---

## 2) Model files and parameters
The sketch expects the model as a C array:
- `gesture_recognition_model_data.cpp` defines `g_gesture_recognition_model_data[]` and `g_gesture_recognition_model_data_len` (generated in `02_Model_Training`).
- `gesture_recognition_model_data.h` declares the externs (already provided).

If you retrain the model, regenerate `gesture_recognition_model_data.cpp` and replace the file in:
- `03_Interence_on_MCU/gesture_recognition_inference/`

Keep these constants in `gesture_recognition.ino` in sync with your notebook:
- `kSequenceLength` (e.g., 50)
- `kNumFeatures` (6 for ax, ay, az, gx, gy, gz)
- `kNumClasses` and `GESTURE_LABELS` order
- `SCALER_MEAN[]` and `SCALER_STD[]` (copy from the notebook output)

---

## 3) Build and upload
1) Open `gesture_recognition_inference/gesture_recognition.ino` in Arduino IDE.
2) Select board and port:
   - Tools → Board → Arduino Mbed OS Nano Boards → Arduino Nano 33 BLE Sense
   - Tools → Port → select your board
3) Upload.
4) Open Serial Monitor at 9600 baud to view predictions.

---

## 4) What the sketch does (high level)
- Reads IMU (accel + gyro), estimates gravity and gyro drift, scales features with provided mean/std.
- Buffers a window of `kSequenceLength × kNumFeatures` (e.g., 50×6) float samples.
- Runs inference with TensorFlow Lite Micro and prints the top prediction with score.

---

## 5) Troubleshooting
Build errors: missing TensorFlowLite headers
- Ensure you installed `Arduino_TensorFlowLite.zip` via Sketch → Include Library → Add .ZIP Library…

Link/flash size too big
- The sketch currently uses `AllOpsResolver` for convenience, which increases flash usage. Switch to a minimal resolver:
  - Uncomment the `MicroMutableOpResolver` block in the sketch and keep only the ops your model needs (Conv2D, MaxPool2D, Reshape, FullyConnected, Softmax, Relu).

AllocateTensors() failed (out of memory)
- Increase `kTensorArenaSize` (e.g., 128*1024 → 160*1024) or reduce model size.

IMU not found
- Install “Arduino_LSM9DS1” and select the correct board “Arduino Nano 33 BLE Sense”.

Predictions look wrong
- Update `SCALER_MEAN`/`SCALER_STD` from the training notebook and confirm label order matches `GESTURE_LABELS`.

---

## 6) Updating the model
- After retraining in `02_Model_Training`, generate `gesture_recognition_model_data.cpp` and copy it into this folder:
  - From: `02_Model_Training/gesture_recognition_model_data.cpp`
  - To: `03_Interence_on_MCU/gesture_recognition_inference/gesture_recognition_model_data.cpp`
- Rebuild and upload the sketch.

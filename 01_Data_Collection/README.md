# IMU Data Collection (Arduino Nano 33 BLE Sense + Web Bluetooth)

This folder contains two parts that work together:
- Arduino firmware: reads IMU data, performs simple cleaning, and streams data over BLE.
- Chrome web app: connects via Web Bluetooth, visualizes the stream, and records CSV files.

Folder layout:
- `datacollection_arduino_Nano33/datacollection.ino` — Arduino sketch
- `Webapp/` — Static site served locally (`index.html`, `app.js`, `style.css`)

---

## 1) Requirements

Hardware
- Arduino Nano 33 BLE Sense (with onboard IMU). The plain "Nano 33 BLE" (without "Sense") does not have the IMU used by this sketch.
- USB cable (Micro‑USB).

PC/Software
- macOS (tested), but any desktop OS with Chrome should work.
- Google Chrome (latest stable) with Web Bluetooth enabled by default.
- Arduino IDE 2.x.

Arduino IDE packages
- Boards: Arduino Mbed OS Nano Boards (Tools → Board Manager → search "Arduino Mbed OS Nano Boards").
- Libraries (Tools → Manage Libraries):
  - ArduinoBLE (by Arduino)
  - Arduino_LSM9DS1 (by Arduino)

Web app
- No npm install is needed. Chart.js is loaded via CDN.
- You can open `Webapp/index.html` directly in Google Chrome. If your Chrome setup blocks Web Bluetooth on `file://`, serve the folder over `http://localhost` instead.

---

## 2) Flash the Arduino firmware

1) Open Arduino IDE and install the board package and the two libraries listed above.
2) Open the sketch: `01_DataCollection/datacollection_arduino_Nano33/datacollection.ino`.
3) Select board/port:
   - Tools → Board → "Arduino Mbed OS Nano Boards" → "Arduino Nano 33 BLE Sense".
   - Tools → Port → select the Nano 33 BLE Sense serial port.
4) Press Upload.
5) After upload, the board will advertise over BLE as `IMUCleanData`.

Tips
- Place the board still for a couple of seconds after power‑up/connect so gravity and gyro drift estimates stabilize.
- Power can remain via USB while streaming to the browser.

---

## 3) What the Arduino sketch sends

BLE
- Service UUID: `19B10000-E8F2-537E-4F6C-D104768A1214`
- Characteristic UUID: `19B10001-E8F2-537E-4F6C-D104768A1214`
- Properties: Notify + Read
- Packet size: 24 bytes (little‑endian)

Payload layout (six 32‑bit floats, in order)
1. linear_ax (g)
2. linear_ay (g)
3. linear_az (g)
4. clean_gx (°/s)
5. clean_gy (°/s)
6. clean_gz (°/s)

Notes
- Acceleration is the raw accelerometer minus estimated gravity (simple running average).
- Gyro drift is estimated when the device is stationary and subtracted.

---

## 4) Run the Web App (Chrome)

You can use either method:

A) Open directly in Chrome
- Open `01_DataCollection/Webapp/index.html` in Chrome (File → Open File… or double‑click the file).
- Click "Connect to Device" to pair with `IMUCleanData`.

B) Serve over localhost (fallback)
- From a terminal:

```zsh
cd /Users/liu/Documents/ODISI_Tutorial/01_DataCollection/Webapp
python3 -m http.server 8000
```

- Then open `http://localhost:8000` in Chrome.

Connect and record
1) Click "Connect to Device" → select `IMUCleanData`.
2) Once connected, live values and charts will update.
3) To record data: enter a label (e.g., `circle`), click "Start Recording", perform the motion, then click "Stop Recording".
4) Click "Save Data" to download a CSV.

CSV format
- Header: `timestamp,label,ax,ay,az,gx,gy,gz`
- Units: ax/ay/az in g, gx/gy/gz in °/s.

---

## 5) Troubleshooting

Device not found in the picker
- Use Chrome on desktop. If opening the file directly doesn’t allow Web Bluetooth on your system, use `http://localhost`.
- Ensure the board is the BLE Sense model with the IMU and that the sketch uploaded successfully.
- Unplug/replug the USB cable, press the reset button, or power‑cycle the board.
- Make sure the device isn’t already connected to another app.

Chrome permission errors ("Not allowed by platform")
- When Chrome asks to allow Bluetooth, click Allow.
- If needed, switch to serving via `http://localhost`.

No motion or values look wrong
- Keep the board still for 2–3 seconds after connecting so gravity/gyro drift estimates stabilize.
- Verify libraries: ArduinoBLE and Arduino_LSM9DS1 must be installed.
- If you are using a different board than Nano 33 BLE Sense (e.g., Sense Rev2 with different sensors), this sketch and library may not match—use the proper IMU library or board.

BLE UUIDs don’t match your project
- You can change the UUIDs in both the sketch (`CUSTOM_SERVICE_UUID`, `DATA_CHAR_UUID`) and `Webapp/app.js` to your own values.

---

## 6) How it works (short)
- Arduino loop reads IMU, estimates gravity and gyro drift, integrates a simple velocity estimate, and streams a 24‑byte packet via BLE notifications.
- The web app uses the Web Bluetooth API to subscribe to notifications, parses six little‑endian floats, updates the UI and chart, and optionally records labeled samples to CSV.

---

## 7) Next steps
- Collect multiple labeled gestures and use the CSVs in `02_Model_Training/IMU_Gesture_Recognition_tutorial.ipynb`.
- Adjust filtering/cleaning or sampling behavior in the Arduino sketch for your application.

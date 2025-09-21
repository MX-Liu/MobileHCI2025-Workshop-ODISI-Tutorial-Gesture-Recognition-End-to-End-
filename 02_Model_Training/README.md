# IMU Gesture Recognition — Model Training

This folder contains a Jupyter notebook to train a gesture recognition model from IMU CSV data and export it for deployment to Arduino (TensorFlow Lite Micro).

Contents
- `IMU_Gesture_Recognition_tutorial.ipynb` — end‑to‑end training, evaluation, TFLite conversion, and C array export instructions.

Note
- You can also access the script via this link: https://drive.google.com/file/d/1zr4YwVgvs94lRIoltW_OpwMIRW8i2aS7/view?usp=sharing

---

## 1) Data expected
Use CSVs recorded by the Web Bluetooth app from `01_DataCollection/Webapp`.
- Columns: `timestamp,label,ax,ay,az,gx,gy,gz`
- Units: accel in g, gyro in °/s
- Place CSVs in a `data/` folder next to the notebook:
  - `02_Model_Training/data/*.csv`

Tips
- Record multiple sessions per class (e.g., `circle`, `updown`, `rightleft`, `null`).
- Keep classes balanced to avoid bias.

---

## 2) How to run the notebook
You can use either Google Colab (simplest) or run locally.

A) Google Colab
1) Open https://colab.research.google.com and upload `IMU_Gesture_Recognition_tutorial.ipynb`.
2) Create folder `/content/data` in the Colab Files panel.
3) Upload your CSVs into `/content/data`.
4) Runtime → Run all. Follow prompts in the notebook.

B) Run locally (macOS)
1) Create a virtual environment (zsh):
```zsh
cd /Users/liu/Documents/ODISI_Tutorial/02_Model_Training
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
```
2) Install dependencies (pick ONE TensorFlow option that works on your machine):
```zsh
# Option 1: Generic TF (x86_64 or compatible)
pip install numpy pandas matplotlib seaborn scikit-learn tensorflow==2.19.0

# Option 2: Apple Silicon (if the line above fails)
pip install numpy pandas matplotlib seaborn scikit-learn tensorflow-macos==2.12 tensorflow-metal
```
3) Open the notebook in VS Code or Jupyter and select the `.venv` kernel.
4) Ensure your CSVs are in `./data`. Run cells from top to bottom.

Notes
- Different Macs may require different TF versions. If `2.19.0` is unavailable, try `tensorflow==2.15.*`.
- If you prefer Conda, create a Conda env with Python 3.10/3.11 and install the same packages.

---

## 3) What the notebook does
- Loads all `data/*.csv` and concatenates them.
- Preprocesses and windows the time‑series.
- Builds and trains a model (TensorFlow/Keras).
- Evaluates and plots metrics.
- Converts the model to TensorFlow Lite (`.tflite`).
- Shows how to export the TFLite model as a C byte array for microcontrollers.

---

## 4) Export to TensorFlow Lite
The notebook includes a cell to create `model.tflite`. If you run locally, it will save into the working folder. In Colab, it saves under the notebook directory (download it from the Files panel if needed).

---

## 5) Generate C array for Arduino
Use this Python snippet (also shown in the notebook) to create a `.cpp` file compatible with the Arduino project variable names:

```python
# Convert model.tflite to C array (.cpp)
import pathlib

tflite_path = pathlib.Path('model.tflite')
model_bytes = tflite_path.read_bytes()

def to_c_array(data: bytes, cols: int = 12):
    hex_lines = []
    line = []
    for i, b in enumerate(data):
        line.append(f'0x{b:02x}')
        if (i + 1) % cols == 0:
            hex_lines.append(', '.join(line))
            line = []
    if line:
        hex_lines.append(', '.join(line))
    return ',\n  '.join(hex_lines)

c_array = to_c_array(model_bytes)
cpp = f'''#include "gesture_recognition_model_data.h"\n\nconst unsigned char g_gesture_recognition_model_data[] = {{\n  {c_array}\n}};\n\nconst int g_gesture_recognition_model_data_len = sizeof(g_gesture_recognition_model_data);\n'''

pathlib.Path('gesture_recognition_model_data.cpp').write_text(cpp)
print('Wrote gesture_recognition_model_data.cpp')
```

This produces `gesture_recognition_model_data.cpp` with:
- `g_gesture_recognition_model_data[]`
- `g_gesture_recognition_model_data_len`

These match the externs declared in `03_Interence_on_MCU/gesture_recognition_inference/gesture_recognition_model_data.h`.

---

## 6) Deploy to Arduino project
1) Copy the generated file into the inference project:
   - From: `02_Model_Training/gesture_recognition_model_data.cpp`
   - To: `03_Interence_on_MCU/gesture_recognition_inference/gesture_recognition_model_data.cpp`
2) Keep the existing header `gesture_recognition_model_data.h` (variable names already match).
3) Rebuild and upload the Arduino inference sketch (`gesture_recognition.ino`).

---

## 7) Troubleshooting
- No CSVs loaded: ensure your files are under `02_Model_Training/data` and have the correct header.
- TensorFlow install errors on macOS: try a different TF version (e.g., 2.15.*) or `tensorflow-macos` + `tensorflow-metal` on Apple Silicon.
- Out‑of‑memory during training: reduce window size, batch size, or model width/filters in the notebook.
- Poor accuracy: collect more balanced data, try more training epochs, or tune preprocessing.

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # aman untuk dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model = tf.keras.models.load_model("hand_sign_model_2.h5")

with open("labels.json", "r") as f:
    labels_data = json.load(f)

# Jika labels.json berupa list, sort dulu
if isinstance(labels_data, list):
    labels = sorted(labels_data)
# Jika labels.json berupa dict dengan index
elif isinstance(labels_data, dict):
    # Convert dict to sorted list berdasarkan key
    labels = [labels_data[str(i)] for i in range(len(labels_data))]
else:
    labels = labels_data

print("="*50)
print("Loaded labels in order:")
for i, label in enumerate(labels):
    print(f"Index {i}: {label}")
print("="*50)
print(f"Model expects {model.output_shape[-1]} classes")
print(f"Labels file has {len(labels)} classes")
print("="*50)

# Validasi jumlah label
assert len(labels) == model.output_shape[-1], \
    f"Label count mismatch! Model expects {model.output_shape[-1]} but got {len(labels)}"

print("Loaded labels:", labels)
print("Model output:", model.output_shape)

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        # BACA FILE DENGAN BENAR
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")

        image = image.resize((128, 128))
        # image = np.array(image) / 255.0
        image = np.expand_dims(image, axis=0)

        prediction = model.predict(image)
        idx = int(np.argmax(prediction))
        confidence = float(np.max(prediction))

        return {
            "prediction": labels[idx],
            "confidence": confidence
        }

    except Exception as e:
        return {
            "error": str(e)
        }

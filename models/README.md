# Face-API.js Models

If you want to use local models instead of loading them from CDN, download the model files from one of the following sources:

## Option 1: @vladmandic/face-api (Recommended)
Download from: https://github.com/vladmandic/face-api/tree/master/model

Required files:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model.bin`
- `face_expression_model-weights_manifest.json`
- `face_expression_model.bin`

## Option 2: Original face-api.js
Download from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights

Required files:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_expression_model-weights_manifest.json`
- `face_expression_model-shard1`

## Important Notes
- Place all files directly in this directory
- Do not change the filenames
- Make sure the manifest files point to the correct binary files

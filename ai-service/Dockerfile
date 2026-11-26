FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8001

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
# Cài PyTorch (tự dùng CUDA nếu host gắn NVIDIA runtime, hoặc fallback CPU)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir -r requirements.txt

COPY app.py prompts.py train_probe.py vision_adapter.py labels.json facets.json thresholds.json calibration.json ./
COPY prototypes.npz* probe.npz* vision_finetuned.pt* ./

RUN mkdir -p data

EXPOSE 8001

HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8001/health')" || exit 1

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]

import boto3
import os
from io import BytesIO
from urllib.parse import unquote_plus
from PIL import Image

s3 = boto3.client("s3")

RESIZE_TARGET = (300, 300)   # max width/height, aspect ratio preserved
SOURCE_PREFIX = "uploads/"
DEST_PREFIX = "resized/"
SUPPORTED_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp")


def lambda_handler(event, context):
    for record in event.get("Records", []):
        bucket = record["s3"]["bucket"]["name"]
        raw_key = record["s3"]["object"]["key"]
        key = unquote_plus(raw_key)  # S3 event keys are URL-encoded (spaces -> '+', etc.)

        print(f"Processing s3://{bucket}/{key}")

        # ---- Guard 1: only process files under uploads/ ----
        if not key.startswith(SOURCE_PREFIX):
            print(f"Skipping '{key}' — not in '{SOURCE_PREFIX}' folder.")
            continue

        # ---- Guard 2: avoid recursive triggering ----
        # (belt-and-suspenders: the S3 trigger itself is also scoped to uploads/ only,
        # but we double check here in case the trigger config is ever widened)
        if key.startswith(DEST_PREFIX):
            print(f"Skipping '{key}' — already inside '{DEST_PREFIX}'.")
            continue

        # ---- Guard 3: only process supported image types ----
        if not key.lower().endswith(SUPPORTED_EXTENSIONS):
            print(f"Skipping '{key}' — unsupported file extension.")
            continue

        filename = key[len(SOURCE_PREFIX):]  # strip "uploads/" prefix
        dest_key = f"{DEST_PREFIX}{filename}"

        try:
            # ---- Download original from S3 into memory ----
            response = s3.get_object(Bucket=bucket, Key=key)
            image_bytes = response["Body"].read()
            content_type = response.get("ContentType", "image/jpeg")

            # ---- Resize with Pillow, preserving aspect ratio ----
            with Image.open(BytesIO(image_bytes)) as img:
                img = img.convert("RGB") if img.mode in ("RGBA", "P") and _is_jpeg(filename) else img
                img.thumbnail(RESIZE_TARGET, Image.LANCZOS)  # in-place, keeps aspect ratio

                output_buffer = BytesIO()
                save_format = _pillow_format_for(filename)
                img.save(output_buffer, format=save_format, quality=85, optimize=True)
                output_buffer.seek(0)

            # ---- Upload resized image back to S3 ----
            s3.put_object(
                Bucket=bucket,
                Key=dest_key,
                Body=output_buffer,
                ContentType=content_type,
            )

            print(f"Successfully resized -> s3://{bucket}/{dest_key}")

        except Exception as e:
            # Logged to CloudWatch; re-raised so Lambda marks this invocation as failed
            print(f"ERROR processing {key}: {str(e)}")
            raise e

    return {"statusCode": 200, "body": "Processing complete"}


def _is_jpeg(filename: str) -> bool:
    return filename.lower().endswith((".jpg", ".jpeg"))


def _pillow_format_for(filename: str) -> str:
    ext = filename.lower()
    if ext.endswith((".jpg", ".jpeg")):
        return "JPEG"
    if ext.endswith(".png"):
        return "PNG"
    if ext.endswith(".webp"):
        return "WEBP"
    return "JPEG"
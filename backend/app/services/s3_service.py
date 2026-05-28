"""
AWS S3 storage service with local file fallback.
"""
import os
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from typing import Optional


def _get_s3_client():
    """Create and return an S3 client using environment credentials."""
    return boto3.client(
        "s3",
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_KEY"),
        region_name=os.environ.get("AWS_REGION", "us-east-1"),
    )


def upload_to_s3(local_path: str, s3_key: str) -> Optional[str]:
    """
    Upload a local file to S3.

    Returns:
        S3 public URL if successful, None on failure.
    """
    bucket = os.environ.get("AWS_BUCKET")
    if not bucket or not os.environ.get("AWS_ACCESS_KEY"):
        return None

    try:
        client = _get_s3_client()
        client.upload_file(local_path, bucket, s3_key)
        region = os.environ.get("AWS_REGION", "us-east-1")
        return f"https://{bucket}.s3.{region}.amazonaws.com/{s3_key}"
    except (ClientError, NoCredentialsError):
        return None


def download_from_s3(s3_key: str, local_path: str) -> bool:
    """Download a file from S3 to local path. Returns True on success."""
    bucket = os.environ.get("AWS_BUCKET")
    if not bucket:
        return False

    try:
        client = _get_s3_client()
        client.download_file(bucket, s3_key, local_path)
        return True
    except (ClientError, NoCredentialsError):
        return False


def get_presigned_url(s3_key: str, expiry: int = 3600) -> Optional[str]:
    """Generate a presigned URL for temporary file access."""
    bucket = os.environ.get("AWS_BUCKET")
    if not bucket:
        return None

    try:
        client = _get_s3_client()
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": s3_key},
            ExpiresIn=expiry,
        )
        return url
    except (ClientError, NoCredentialsError):
        return None

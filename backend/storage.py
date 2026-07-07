# storage.py
import os
import json
import tempfile
import sqlite3
from io import BytesIO
from google.cloud import storage
from fastapi import UploadFile

def get_gcs_client():
    """Initializes and returns a Google Cloud Storage client."""
    gcp_key_json = os.getenv("GCP_SERVICE_ACCOUNT_KEY")
    if not gcp_key_json:
        raise ValueError("Missing GCP_SERVICE_ACCOUNT_KEY environment variable")
    
    credentials_info = json.loads(gcp_key_json)
    return storage.Client.from_service_account_info(credentials_info)

def get_db_blob():
    """Gets the database blob from GCS."""
    client = get_gcs_client()
    bucket_name = os.getenv("GCP_BUCKET_NAME")
    if not bucket_name:
        raise ValueError("Missing GCP_BUCKET_NAME environment variable")
    
    bucket = client.bucket(bucket_name)
    return bucket.blob("aleyo.db")  # your database file path in GCS

# ─────────────────────────────────────────────
# READ operations (download, query, discard)
# ─────────────────────────────────────────────

def query_database(sql: str, params: tuple = ()):
    """
    Downloads the SQLite DB from GCS, runs a read-only query, returns results.
    Does NOT modify the database in GCS.
    """
    blob = get_db_blob()
    
    # Download to a temporary file
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        blob.download_to_file(tmp)
        tmp_path = tmp.name
    
    try:
        conn = sqlite3.connect(tmp_path)
        conn.row_factory = sqlite3.Row  # returns dict-like rows
        cursor = conn.cursor()
        cursor.execute(sql, params)
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return results
    finally:
        os.unlink(tmp_path)  # clean up temp file

# ─────────────────────────────────────────────
# WRITE operations (download, modify, re-upload)
# ─────────────────────────────────────────────

def execute_and_upload(sql: str, params: tuple = ()):
    """
    Downloads the SQLite DB from GCS, executes a write query, re-uploads it.
    WARNING: This is NOT safe for concurrent requests — last write wins.
    """
    blob = get_db_blob()
    
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        blob.download_to_file(tmp)
        tmp_path = tmp.name
    
    try:
        conn = sqlite3.connect(tmp_path)
        cursor = conn.cursor()
        cursor.execute(sql, params)
        conn.commit()
        conn.close()
        
        # Re-upload the modified database
        blob.upload_from_filename(tmp_path)
        return True
    finally:
        os.unlink(tmp_path)

# ─────────────────────────────────────────────
# File upload/delete helpers (your existing code, fixed)
# ─────────────────────────────────────────────

def upload_file_to_gcs(file: UploadFile, destination_blob_name: str) -> str:
    client = get_gcs_client()
    bucket_name = os.getenv("GCP_BUCKET_NAME")
    if not bucket_name:
        raise ValueError("Missing GCP_BUCKET_NAME environment variable")
    
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_file(file.file, content_type=file.content_type)
    
    return f"https://storage.googleapis.com/{bucket_name}/{destination_blob_name}"

def delete_file_from_gcs(blob_name: str):
    client = get_gcs_client()
    bucket_name = os.getenv("GCP_BUCKET_NAME")
    if not bucket_name:
        raise ValueError("Missing GCP_BUCKET_NAME environment variable")
    
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    blob.delete()
    print(f"Deleted {blob_name} from GCS.")

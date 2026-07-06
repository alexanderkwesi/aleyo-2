# storage.py
import os
import json
from google.cloud import storage
from fastapi import UploadFile

def get_gcs_client():
    """Initializes and returns a Google Cloud Storage client."""
    # 1. Get the JSON string from your Render Environment Variables
    gcp_key_json = os.getenv("GCP_SERVICE_ACCOUNT_KEY")
    
    if not gcp_key_json:
        raise ValueError("Missing GCP_SERVICE_ACCOUNT_KEY environment variable")

    # 2. Parse the JSON string into a Python dictionary
    credentials_info = json.loads(gcp_key_json)
    
    # 3. Initialize the client using the dictionary
    return storage.Client.from_service_account_info(credentials_info)

def upload_file_to_gcs(file: UploadFile, destination_blob_name: str) -> str:
    """
    Uploads a file to GCS and returns its public URL.
    """
    client = get_gcs_client()
    bucket_name = os.getenv("GCP_BUCKET_NAME")
    
    if not bucket_name:
        raise ValueError("Missing GCP_BUCKET_NAME environment variable")

    bucket = client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    # Upload the file contents
    blob.upload_from_file(file.file, content_type=file.content_type)

    # Construct and return the public URL
    # Note: If your bucket is private, you will need to generate a signed URL instead
    public_url = f"https://storage.googleapis.com/{bucket_name}/{destination_blob_name}"
    
    return public_url

def delete_file_from_gcs(blob_name: str):
    """Deletes a file from GCS."""
    client = get_gcs_client()
    bucket_name = os.getenv("GCP_BUCKET_NAME")
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    
    blob.delete()
    print(f"Deleted {blob_name} from GCS.")

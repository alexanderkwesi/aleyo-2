# storage.py
import os
import json
from google.cloud import storage
from fastapi import UploadFile

def get_gcs_client():
    """Initializes and returns a Google Cloud Storage client."""
    # 1. Get the JSON string from your Render Environment Variables
    gcp_key_json = os.getenv("GCP_SERVICE_ACCOUNT_KEY",
                            
     "{
  "type": "service_account",
  "project_id": "aleyo-501110",
  "private_key_id": "e820ce748733453fbe6dfa172136e4be7d2d9b8d",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDY5Eobcdk9SSDJ\nxIrFKGjbqZvknaiHmhqDRAISErPNJbno3zgKm7QVlHuOobW7ZqIg9X5tk2RuhEkl\nAeDqY06g9s0at0udNLIXCDp9Ht5KPqU4D4kWOkjFEDG+fbjrBvrPim+gBMzJZ3qm\nhWyGXVYTztVua8CL3DEriGbZREv0nBPciCreTF5VahOKs1JoGBxUVcok+yq7VQtq\nz7ca8SNEUHKtfmw/1kigIXUZCfs/JabBztZuez7x6mUWTVMl23YJTBKsu/EpFUrr\nm2xZ8lWKQCBR1/v6kzarjazUORFJb/urKYZXJbxIim+R6U14cvC/8phNhubOAM94\nA9zvA3UVAgMBAAECggEABASYpdus/KsT5ID+WXWB7x3RgZb1G2FSCpVSMipZXTHM\nzkus/Vn8kvtvnYkRNYygG3BeJvgDH96rVI2YGyd7T6qQH/r+IjEAIpftrh80sCyV\nwXfc4DCfY/0vOrpCrcybjV2LwKu4wntnBNo1vuMlmCjYVdsWU6ZLh+UB6MD7Oj0N\njEBtIZEjfqVf71aSSMKBGIQVuZTPTuHM6P+PFCVejq95/sgCMdVNX6kGwnkgL+9Q\nvgkprcIpsAtFUzqaIjEENwAJy340LS+7YsqJwW5uZF2ZikBp945CRYQyfUQK/AGx\nC33DIynmeS5t36XCNkUycTbgZmxSMi7KBd9pLZotGQKBgQD6jD769YG8mQ0A3dhl\nxnEJZDI2i49qdYJt7WNjnrwo1EoBE3v8QS6VsAC+iuyxNUXURuId9YsyMTeAEacb\nYuPCTB/7KeHHIukLBXtPLhpXV0j+H3FNQMdELcej4/DabdB+VJnumWvTdRMT8bfX\nNzLx3LehiqI3LbqfCoyctVVK/QKBgQDdnI1IuMgopJTl9qMFX2ZV7yJrM9CZl6pr\njxJO8ZQM281MUCfMt9MlG7nvtysMj3zkYb9AvSYTfeIIEs9LQb/3occLv8pm4UY5\nAYkYGXoptsV2C2bmZhvCLohOCaqLb9rM4ZMz80bAcmvoQJf4CERcfg5uV8P+0fy7\nWW4+V6cp+QKBgQCBSzaFE4Sr6t+G/vTZMJrMmeQ/ua185r80MzkDA7td5o96Fq/4\n8To1DOqVaePTXwZ2EU5G35vBfxyA/psZyuJ2Ngqa9nYI6b8RbPbBWa1GPUjxuxAh\nKbirOmS38r0sO1dImigFtS6rpNL/i9GvQlEL9zbcKkqj5vlTcYI2rG0jkQKBgQCY\n4hOmA7QyNbhzHT9ByZqz1hGMm2ZhT3xGT6F1zLsyU8DB0NpkJL0JcKNJeLe+Jo8m\njzh91P+bmtCAeVmAtY9VqsnClUFw0CC92w1VDt50QJ7g3OTUNcUYpTlrfMenAjeT\n+FqxEDfTNBy1UTqF5k4i8OPLw8h21y7foMapQ5cTIQKBgQDHygovIgSUWtL/tdML\nA0nQ7VCcCeWm3TtuTwKXr1+DouLh4++7zcAnC/GWn/UChdseo58dmHYNasgSmKEf\nBexgvXo5Yjw8rXrEKqVWeOiBcdaH1gC3tGtXaPReqRV0wKPRrv82LwIh72De0O5a\nf8/k3pJF3MqSW3NeOdjdTMbzjg==\n-----END PRIVATE KEY-----\n",
  "client_email": "render-backend-service@aleyo-501110.iam.gserviceaccount.com",
  "client_id": "115258360679518454694",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/render-backend-service%40aleyo-501110.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
" )
    
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
    bucket_name = os.getenv("GCP_BUCKET_NAME", "aleyo_bucket")
    
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

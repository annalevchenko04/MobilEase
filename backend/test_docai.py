# test_docai.py
import os
from dotenv import load_dotenv
load_dotenv()

from google.cloud import documentai_v1 as documentai
from google.api_core.client_options import ClientOptions

project   = os.environ["GOOGLE_PROJECT_ID"]
location  = os.environ.get("GOOGLE_LOCATION", "us")
processor = os.environ["GOOGLE_PROCESSOR_ID"]

print(f"Project:   {project}")
print(f"Location:  {location}")
print(f"Processor: {processor}")
print(f"Credentials: {os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')}")

opts = ClientOptions(api_endpoint=f"{location}-documentai.googleapis.com")
client = documentai.DocumentProcessorServiceClient(client_options=opts)
name = client.processor_path(project, location, processor)

print(f"\nProcessor path: {name}")
print("✅ Client created successfully")

# Try to get processor info
try:
    processor_info = client.get_processor(name=name)
    print(f"✅ Processor found: {processor_info.display_name}")
    print(f"✅ Processor type: {processor_info.type_}")
    print(f"✅ Processor state: {processor_info.state}")
except Exception as e:
    print(f"❌ Error: {e}")
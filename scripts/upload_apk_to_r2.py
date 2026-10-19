import os
import boto3

def load_env():
    env = {}
    with open('.env.local', 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"\'')
    return env

env = load_env()
s3 = boto3.client(
    's3',
    endpoint_url=f"https://{env['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=env['R2_ACCESS_KEY_ID'],
    aws_secret_access_key=env['R2_SECRET_ACCESS_KEY'],
    region_name='auto'
)

print('Uploading DocTruyen-VIP.apk to R2...')
s3.upload_file(
    'DocTruyen-VIP.apk',
    env['R2_BUCKET_NAME'],
    'DocTruyen-VIP.apk',
    ExtraArgs={
        'ContentType': 'application/vnd.android.package-archive',
        'ContentDisposition': 'attachment; filename="DocTruyen-VIP.apk"',
        'CacheControl': 'public, max-age=60'
    }
)
print(f'Uploaded successfully! Size: {os.path.getsize("DocTruyen-VIP.apk")} bytes')

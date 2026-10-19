import urllib.request
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
qr_url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=https%3A%2F%2Fdoctruyen.vip%2Ftai-app'
urllib.request.urlretrieve(qr_url, 'qr-tai-app.png')

s3 = boto3.client(
    's3',
    endpoint_url=f"https://{env['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
    aws_access_key_id=env['R2_ACCESS_KEY_ID'],
    aws_secret_access_key=env['R2_SECRET_ACCESS_KEY'],
    region_name='auto'
)

with open('qr-tai-app.png', 'rb') as f:
    s3.put_object(
        Bucket=env['R2_BUCKET_NAME'],
        Key='qr-tai-app.png',
        Body=f.read(),
        ContentType='image/png',
        CacheControl='public, max-age=31536000, immutable'
    )
print('QR Code uploaded to R2 successfully: https://media.doctruyen.vip/qr-tai-app.png')

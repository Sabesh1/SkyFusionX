import urllib.request
import urllib.parse
import urllib.error
import json

req = urllib.request.Request(
    'http://localhost:8000/api/v1/auth/login',
    data=urllib.parse.urlencode({'username':'admin','password':'password'}).encode('utf-8'),
    headers={'Content-Type': 'application/x-www-form-urlencoded'}
)

try:
    res = urllib.request.urlopen(req)
    print(res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(e.read().decode('utf-8'))

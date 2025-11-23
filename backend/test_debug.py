import requests

def safe_request(method: str, url: str, **kwargs):
    """Make request and handle exceptions. Returns response even for HTTP errors (4xx, 5xx)"""
    try:
        # Don't raise exceptions for HTTP errors - we want to test error responses
        if method == "GET":
            return requests.get(url, **kwargs, timeout=5)
        elif method == "POST":
            return requests.post(url, **kwargs, timeout=5)
        elif method == "PATCH":
            return requests.patch(url, **kwargs, timeout=5)
        elif method == "PUT":
            return requests.put(url, **kwargs, timeout=5)
        elif method == "DELETE":
            return requests.delete(url, **kwargs, timeout=5)
    except requests.exceptions.Timeout:
        print(f"      ⚠️  Request timeout for {method} {url}")
        return None
    except requests.exceptions.ConnectionError:
        print(f"      ⚠️  Connection error for {method} {url}")
        return None
    except Exception as e:
        print(f"      ⚠️  Unexpected error: {str(e)}")
        return None

# Test validation
response = safe_request("POST", "http://localhost:8000/api/campaigns", json={"name": "Missing fields"})
print(f"Response object: {response}")
print(f"Response type: {type(response)}")
print(f"Response is None: {response is None}")
print(f"Response bool: {bool(response)}")
print(f"Response equals False: {response == False}")

# Try accessing directly without if check
try:
    status = response.status_code
    print(f"Status code: {status}")
    text = response.text
    print(f"Response text: {text[:200]}")
except Exception as e:
    print(f"Error: {e}")

if response is not None and response.status_code == 422:
    print("✅ TEST PASSED: Got 422")
else:
    print(f"❌ TEST FAILED: Expected 422, got {response.status_code if response is not None else 'No response'}")

import requests

def test_query(query: str):
    print(f"\n--- QUERY: {query} ---")
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/copilot/chat",
        json={"query": query, "history": []}
    )
    if response.status_code == 200:
        data = response.json()
        print(f"TEXT:\n{data.get('text')}")
        print(f"CHIPS: {data.get('sourceChips')}")
    else:
        print(f"ERROR: {response.status_code} - {response.text}")

test_query("What are the recent events?")
test_query("What happened in Tamil Nadu today?")
test_query("Show flood events.")
test_query("Which reports need human verification?")
test_query("Which events have the highest risk?")
test_query("How many reports are in our database?")
test_query("Show low-trust reports.")
test_query("What is the current weather in Chennai?")
test_query("Will current Chennai weather support our recent flood reports?")

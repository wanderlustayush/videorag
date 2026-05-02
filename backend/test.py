import requests

url = "https://youtube-transcript3.p.rapidapi.com/api/transcript"
headers = {
    "x-rapidapi-key": "2efb77393emsh48c9d7784c5d4b0p168d0cjsn557e0e70ef33",
    "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com",
    "Content-Type": "application/json"
}
params = {"videoId": "dQw4w9WgXcQ"}
response = requests.get(url, headers=headers, params=params)
print(response.json())
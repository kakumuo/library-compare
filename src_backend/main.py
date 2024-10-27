# flask --app main run
from flask import Flask, request, make_response, json, Response
from flask_cors import CORS

from pymongo import MongoClient
from steam_web_api import Steam
from uuid import uuid4

import time
import math

myclient = MongoClient("mongodb://10.0.0.109:27017")
db = myclient["SteamLibraryCompareDB"]

config = db.get_collection("config").find_one()
steam = Steam(config["apiKey"])

app = Flask(__name__)
cors = CORS(app, supports_credentials=True, methods=['GET', 'POST'], allow_headers=['Content-Type', 'Accept', 'Set-Cookies'])
COOKIE_KEY:str = 'kapp.libCompare.visitorId'

# create or get session
@app.route("/", methods=['GET', 'POST'])
def index():
    resp:Response = createResponse(success=True, message=f"Could not {'update' if request.method == 'POST' else 'find/create'} session")
    sessionsDb = db.get_collection('sessions')

    if(request.method == 'GET'):
        if(request.cookies.get(COOKIE_KEY) != None and sessionsDb.find_one({"_id": request.cookies.get(COOKIE_KEY)}) != None):
            sessionId = request.cookies.get(COOKIE_KEY)
            sessionData = sessionsDb.find_one({"_id": sessionId})
            resp = createResponse(success=True, message=f"Found sesssion {sessionId}", data=sessionData)
        else:
            targetUUID = str(uuid4())
            data = {
                "_id": targetUUID, 
                "created": math.floor(time.time() * 1000),
                "updated": math.floor(time.time() * 1000),
                "users": [],
                "filters": []
            }
            sessionsDb.insert_one(data)
            resp = createResponse(success=True, message=f"Creating session {targetUUID}", data=data)
            resp.set_cookie(COOKIE_KEY, targetUUID, path='/', samesite=None)

    elif(request.method == 'POST' and request.cookies.get(COOKIE_KEY) != None):
        sessionId = request.cookies.get(COOKIE_KEY)
        print(sessionId)
        sessionsDb.replace_one({"_id": sessionId}, request.json)
        resp = createResponse(success=True, message=f"Updated Session {sessionId}")

    return resp
    

@app.route("/search/<usernameOrId>")
def searchUser(usernameOrId):
    
    resp:Response = None; 
    searchResp = steam.users.search_user(usernameOrId)

    if(searchResp == 'No match'):
        resp = createResponse(success=False, message=f"Username or SteamId '{usernameOrId}' not found")
    else: 
        steamid = searchResp["player"]["steamid"]
        gameList = steam.users.get_owned_games(steamid)

        data:dict = {
            "name": searchResp["player"]["personaname"],
            "steamid": searchResp["player"]["steamid"], 
            "profileurl": searchResp["player"]["profileurl"],
            "avatar": searchResp["player"]["avatar"], 
            "game_count": gameList['game_count'] if 'game_count' in gameList else 0,
        }
        
        data["games"] = [{
            "appid": game["appid"], 
            "img_icon_url": f'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/{game["appid"]}/{game["img_icon_url"]}.ico', 
            "banner_url": f'https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{game["appid"]}/header.jpg',
            "name": game["name"], 
            "playtime_forever": game["playtime_forever"], 
            "rtime_last_played": game["rtime_last_played"] if 'rtime_last_played' in game else 0,
        } for game in gameList['games']] if 'games' in gameList else []

        ''

        resp = createResponse(True, f"Found User {usernameOrId}", data)

    return resp


def createResponse(success:bool, message:str, data:any=None):
    response = make_response()
    payload:dict = {
        "success": success, 
        "message": message, 
    }

    if(data):
        payload["data"] = data
    
    response.set_data(json.dumps(payload))
    return response

import { APIResponse, ISessionData, IUserData } from "./types";


const BASE_URL = "http://127.0.0.1:5000"

export const api_getSession = async ():Promise<APIResponse<ISessionData>> => {
    const resp = await fetch(BASE_URL, {
        credentials: 'include', 
        headers: {
            'Set-Cookies': document.cookie, 
            'Content-Type': 'application/json', 
            'Accept': 'application/json'
        },
    });

    const respJson = await resp.json();
    return respJson; 
}

export const api_searchUser = async (userNameOrId:string):Promise<APIResponse<IUserData>> => {
    const resp = await fetch(`${BASE_URL}/search/${userNameOrId}`, {
        credentials: 'include', 
        headers: {
            'Content-Type': 'application/json', 
            'Accept': 'application/json'
        },
    })
    
    const respJson = await resp.json(); 
    return respJson;
}

export const api_updateSession = async (sessionData:ISessionData) => {
    const resp = await fetch(BASE_URL, {
        credentials: 'include', 
        headers: {
            'Set-Cookies': document.cookie, 
            'Content-Type': 'application/json', 
            'Accept': 'application/json'
        },
        body: JSON.stringify(sessionData), 
        method: 'POST'
    });
}




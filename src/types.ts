export interface APIResponse<T> {
    success:boolean, 
    message:string, 
    data?:T
}

export interface ISessionData {
    _id:string, 
    created:number, 
    updated:number,
    users:IUserData[],
    filters:string[]
}

export interface IUserData {
    name:string, 
    steamid:string, 
    profileurl:string, 
    avatar:string, 
    game_count:number, 
    games:IGameData[]
}

export interface IGameData {
    appid:number, 
    img_icon_url:string, 
    banner_url:string,
    name:string, 
    playtime_forever:number, 
    rtime_last_played:number,
}

export interface IGameAggregateData {
    appid:number, 
    img_icon_url:string, 
    banner_url:string,
    name:string, 
    diversity:number,
    users: {
        name:string, 
        steamid:string, 
        profileurl:string, 
        avatar:string, 
        playtime_forever:number, 
        rtime_last_played:number,
    }[]
}

import React from 'react'

import { IGameAggregateData, ISessionData, IUserData } from './types';
import { api_getSession, api_searchUser, api_updateSession } from './api';

import './style.css'


const colorList = ["lightgreen", "lightblue", "lightcoral", "lightyellow", "lightseagreen"]

function App() {
  const [sessionData, setSessionData] = React.useState<ISessionData>({} as ISessionData)
  const [searchFilters, setSearchFilters] = React.useState<string[]>([])
  const [gameAggData, setGameAggData] = React.useState<IGameAggregateData[]>([])
  const [gameAggDataBuffer, setGameAggDataBuffer] = React.useState<IGameAggregateData[]>([])
  const [userColorDict, setUserColorDict] = React.useState({} as {[key:string]:string})

  React.useEffect(() => {
    (async()=>{
      const sessionDataResp = await api_getSession()
      if(!(sessionDataResp.success && sessionDataResp.data)) return;

      updateSessionData(sessionDataResp.data, false)
      setSearchFilters(sessionDataResp.data.filters)
    })()
  }, [])

  const updateSessionData = async (tmpSessionData:ISessionData, updateBackend:boolean = true) => {
    tmpSessionData.updated = Date.now()

    const aggGameDataDict:{[key:number]:IGameAggregateData} = {}
    const tmpColorDict = Object.assign(userColorDict)
    let colorListI = 0; 
    tmpSessionData.users.forEach(user => {
      user.games.forEach(game => {
          if(!(game.appid in aggGameDataDict)) {
            aggGameDataDict[game.appid] = {
              appid: game.appid, 
              banner_url: game.banner_url,
              img_icon_url: game.img_icon_url, 
              name: game.name, 
              diversity: 1,
              users: []
            }
          }

          aggGameDataDict[game.appid].diversity = aggGameDataDict[game.appid].users.length / tmpSessionData.users.length
          aggGameDataDict[game.appid].users.push({
            avatar: user.avatar, 
            name: user.name, 
            profileurl: user.profileurl, 
            steamid: user.steamid, 
            playtime_forever: game.playtime_forever, 
            rtime_last_played: game.rtime_last_played
          })
        })
        
        tmpColorDict[user.steamid] = colorList[colorListI++]
      })



    setUserColorDict(tmpColorDict); 
    setGameAggData(Object.values(aggGameDataDict))
    setSessionData(tmpSessionData); 

    var tmp:IGameAggregateData[] = Object.values(aggGameDataDict)
    tmpSessionData.filters.forEach(filter => {
      tmp = tmp.filter(cur => cur.name.includes(filter))
    })
    setGameAggDataBuffer(tmp)

    if(updateBackend) api_updateSession(tmpSessionData);  
  }

  const handleUserSearch = async (userNameOrId:string) => {
    // todo: display alert for searching for a user that already is in the list
    if(sessionData.users.findIndex(user => user.profileurl.includes(userNameOrId) || user.steamid == userNameOrId) != -1)
      return

    const tmpSessionData = Object.assign({}, sessionData)
    if(!tmpSessionData.users)
      tmpSessionData.users = []
    const resp = await api_searchUser(userNameOrId)
    if(resp.success && resp.data) {
      tmpSessionData.users.push(resp.data)
      updateSessionData(tmpSessionData)
    } 
  }

  const handleUserRemove = async (steamId:string) => {
    const tmpSessionData = Object.assign({}, sessionData)
    tmpSessionData.users = tmpSessionData.users.filter(user => user.steamid != steamId)
    updateSessionData(tmpSessionData)
  }

  const handleFilterAdd = (searchFilterText:string|undefined) => {
    if(!searchFilterText) return;
    const filterList:string[] = [...searchFilters, searchFilterText]
    setSearchFilters(filterList)

    const tmpSessionData = Object.assign({}, sessionData)
    tmpSessionData.filters = filterList; 
    updateSessionData(tmpSessionData)
  }

  const handleFilterRemove = (filterI:number) => {
    const filterList:string[] = searchFilters.filter((_, i) => i != filterI)
    setSearchFilters(filterList)
    
    const tmpSessionData = Object.assign({}, sessionData)
    tmpSessionData.filters = filterList; 
    updateSessionData(tmpSessionData)
  }
 

  const sidebarStyle:React.CSSProperties = {
    display: 'grid', 
    gridTemplateRows: 'auto auto 1fr', 
    backgroundColor: "lightgray", 
    padding: "16px"
  }


  return (
    <div style={{width: '100vw', height: '100vh', display: 'flex', padding: '50px'}} >
      
      {/* sidebar */}
      <aside style={sidebarStyle}> 
        <img src="https://png.pngtree.com/png-vector/20230228/ourmid/pngtree-comparison-line-icon-vector-png-image_6623920.png" alt="" />
        <input onKeyDown={(ev) => {
            if(ev.key == 'Enter' && ev.currentTarget.value.trim() != "") {
              handleUserSearch(ev.currentTarget.value)
              ev.currentTarget.value = ""
            }
        }} type='text' />

        {/* user list */}
        <div style={{overflowY:'scroll', gap: '4px', display: 'flex', flexDirection: 'column'}}>{sessionData.users && sessionData.users.map((user, userI) => <UserListItem onRemove={() => handleUserRemove(user.steamid)} key={userI} data={user} userColor={userColorDict[user.steamid]} />)}</div>
      </aside>

      {/* maincontent */}
      <main style={{border: 'solid', width: '100%', display: 'grid', padding: '8px'}}>

        {/* banner */}
        <section style={{display: 'grid', gridTemplateColumns: '15vw 15vw', gridTemplateRows: '15vw', justifyContent: 'space-around', padding: '8px'}}>
          <StatCard amount={gameAggData.length} amountType='number' text='Total Unique Games'/>
          <StatCard amount={gameAggData.reduce((total, cur) => total + cur.diversity, 0) / gameAggData.length * 100} amountType='percentage' text='Similar Games'/>
        </section>

        {/* search section */}
        <section style={{display: 'grid', gridTemplateRows: 'auto auto', gap: '8px'}}>
          <input onKeyDown={(ev) => {
            if(ev.key == 'Enter' && ev.currentTarget.value.trim() != ""){
              handleFilterAdd(ev.currentTarget.value.trim())
              ev.currentTarget.value = ""
            }
          }} />
          {/* tag section */}
          {searchFilters.length > 0 && <div style={{display: 'flex', gap: "4px", padding: "4px"}}>
            {searchFilters.map((filter, filterI) => <TextTag text={filter} onRemove={() => handleFilterRemove(filterI)} />)}
          </div>}
        </section>

        {/* game list */}
        <div style={{overflowY:'scroll', gap: '4px', display: 'flex', flexDirection: 'column'}}>{gameAggDataBuffer.map(aggData => <GameListItem key={aggData.appid} gameData={aggData} userColorDict={userColorDict} />)}</div>
      </main>
    </div>
  );
}

const UserListItem = ({data, userColor, onRemove}:{data:IUserData, userColor:string, onRemove:()=>void}) => {
  const gridArea = `
    'i i i . t t t t b'
    'i i i . p1 p1 p1 . .'
    'i i i . p2 p2 . . .'
  `
  return <div style={{border: 'solid', padding: '4px', borderColor: userColor, display: 'grid', gridTemplateAreas: gridArea}}>
      <img style={{gridArea: 'i', width: '100%'}} src={data.avatar}/>
      <p className='title-small' style={{gridArea: 't'}}>{data.name}</p>
      <button style={{gridArea: 'b'}} onClick={onRemove}>x</button>
      <p className='subtext' style={{gridArea: 'p1'}}>SteamID: {data.steamid}</p>
      <p className='subtext' style={{gridArea: 'p2'}}>{data.game_count} games</p>
  </div>
}

const StatCard = ({amount, amountType, text}:{amount:number, amountType:'number'|'percentage', text:string}) => {
  return <div style={{border: 'solid', padding: '4px', display: 'grid', gridTemplateRows: '1fr auto', justifyContent: 'center'}}>
    <p style={{textAlign: 'center', alignSelf: 'center'}}>{amount}{amountType == 'percentage' ? '%' : ''}</p>
    <p>{text}</p>
  </div>
}

const TextTag = ({text, onRemove}:{text:string, onRemove?:()=>void}) => {
  return <div style={{display: 'grid', gap: "4px", gridTemplateColumns: "1fr auto", padding: '4px', border: 'solid gray 2px', borderRadius: '4px', background: 'lightgray'}}>
    <p>{text}</p>
    {
      onRemove && <button onClick={onRemove}>x</button>
    }
  </div>
}

const GameListItem = ({gameData, userColorDict}:{gameData:IGameAggregateData, userColorDict:{[key:string]:string}}) => {
  const gridArea = `
    'i t t t t t t t t t t t'
    'i p p p p p p p p p p p'
    'i p p p p p p p p p p p'
    'i p p p p p p p p p p p'
  `

  return <div style={{display: 'grid', gridTemplateAreas: gridArea, padding: '16px'}}> 
    <img style={{gridArea: 'i', justifySelf: 'center'}} src={gameData.banner_url} />
    <p className='title-med' style={{gridArea: 't'}} >{gameData.name}</p>
    {/* <p style={{gridArea: 's'}} >{gameData.diversity}</p> */}
    {/* <div style={{gridArea: 'g'}}> 
      <p>Some tag</p>     <p>Some tag</p>     <p>Some tag</p>     <p>Some tag</p>     
    </div> */}
      
    {/* common players */}
    <GamePlaytimeDisplay style={{gridArea: 'p', width: '100%', height: "100%"}} userData={gameData.users} userColorDict={userColorDict} />
  </div>
}

const GamePlaytimeDisplay = ({userData, userColorDict, style={}}:{style?:React.CSSProperties,userData:IGameAggregateData['users'], userColorDict:{[key:string]:string}}) => {
  const totalHoursPlayed = userData.reduce((acc, cur) => acc + cur.playtime_forever, 0)
  
  return <div style={{border: "solid", display: 'grid', gridTemplateColumns: userData.map(user => `${user.playtime_forever / totalHoursPlayed}fr`).join(' '), ...style}}>{
    userData.map(user => <PlaytimeSection userData={user} targetColor={userColorDict[user.steamid]} />)
  }</div>
}

const PlaytimeSection = ({userData, targetColor}:{userData:IGameAggregateData['users'][0], targetColor:string}) => {
  const [isVisible, setIsVisible] = React.useState<boolean>(false); 
  const gridArea = `
    'i i i n n n n'
    'i i i p p p p'
    'i i i t t t t'
    'i i i l l l l'
  ` 

  return <div style={{position: 'relative'}} onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
    <div style={{minWidth: '50px', backgroundColor: targetColor, width: '100%', height: "100%"}} />
    {
      isVisible && 
      <div style={{zIndex: 100, position: 'absolute', display: 'grid', gridTemplateAreas: gridArea, backgroundColor: targetColor, border: 'solid', left: '50%', transform: 'translate(-50%, 0)'}}> 
        <img style={{gridArea: 'i'}} src={userData.profileurl} />
        <p style={{gridArea: 'n'}}>{userData.name}</p>
        <p style={{gridArea: 't'}}>Playtime: {formatPlaytime(userData.playtime_forever)}</p>
        <p style={{gridArea: 'l'}}>Last Played: {formatLastPlayed(userData.rtime_last_played)}</p>
      </div>
    }

  </div>

}

/*
width: `${user.playtime_forever / totalHoursPlayed}fr`
*/

// util

const formatPlaytime = (playtimeMins:number):string => {
  const hours:number = Math.floor(playtimeMins / 60)
  const mins:number = playtimeMins % 60; 

  const res = []
  if(hours > 0)
    res.push(hours + " hours")
  res.push(mins + " mins")
  return res.join(" ")
}

const formatLastPlayed = (lastPlayed:number):string => {
  const now = Date.now() / 1000; 
  const diff = now - lastPlayed
  if (lastPlayed == 0) return "Never"
  else if(diff < 10) return 'Right now'
  else if (diff < 60) return `${diff} seconds ago`
  else if (diff < 60 * 60) return `${Math.floor(diff / 60)} minutes ago`
  else if (diff < 60 * 60 * 24) return `${Math.floor(diff / 60 / 60)} hours ago`
  else if (diff < 60 * 60 * 24 * 7) return `${Math.floor(diff / 60 / 60 / 7)} days ago`
  else return new Date(lastPlayed * 1000).toLocaleString()
}


export default App;

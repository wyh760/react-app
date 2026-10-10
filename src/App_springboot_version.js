import './App.css';
import { useState, useEffect } from 'react';

// [수정 2026-10-08] Spring Boot API 주소 (firstproject, 8080)
const API_URL = 'http://localhost:8080/api/topics';

function Header(props){
  console.log('props',props, props.title);
  return<header>
    <h1><a href='/' 
    onClick={
      function(event){
        event.preventDefault();
        props.onChangeMode();
      }
    }
    >{props.title}</a></h1>
  </header>
}

function Nav(props){
  const lis =[]
      
  for(let i=0; i<props.topics.length; i++){
      let t =props.topics[i];
      lis.push(<li key={t.id}>
        <a id={t.id} href={'/read/'+t.id} onClick={
          event=>{
          event.preventDefault();
          props.onChangeMode(Number(event.target.id));
        }
        }>{t.title}</a>
      </li>)
  }

  return<nav>
    <ol>
      {lis}
    </ol>
    </nav>
}

function Article(props){
  return(<article>
      <h2>{props.title}</h2> 
      {props.body}
  </article>
  );
 }

function Create(props){

   return <article>
    <h2>Create</h2>
    <form onSubmit={
      event=>{
        event.preventDefault();
        const title = event.target.title.value;
        const body = event.target.body.value;
        props.onCreate(title, body);
      }
    }>
      <p><input type="text" name="title" placeholder="title"/></p>
      <p><textarea name="body" placeholder="body"></textarea></p>
      <p><input type="submit" value="Create"></input></p>
    </form>
  </article>
}

function Update(props){
  const [title, setTitle] = useState(props.title);
  const [body, setBody] = useState(props.body);

 return <article>
    <h2>Update</h2>
    <form onSubmit={
      event=>{
        event.preventDefault();
        props.onUpdate(title, body);
       }
    }>
      <p><input type="text" name="title" placeholder="title" value={title}
        onChange={event=>setTitle(event.target.value)}/></p>
      <p><textarea name="body" placeholder="body" value={body}
        onChange={event=>setBody(event.target.value)}></textarea></p>
      <p><input type="submit" value="Update"></input></p>
    </form>
  </article>
}

function App() {

  const [mode, setMode] = useState('WELCOME');
  const [id, setId] = useState(null);
  // [수정 2026-10-08] nextId 삭제: id는 DB가 자동으로 붙여 줌
  // [수정 2026-10-08] 임시 데이터 대신 빈 배열로 시작, 서버에서 불러옴
  const [topics, setTopics] = useState([]);

  // [수정 2026-10-08] 처음 화면 로딩 시 목록 조회 (GET /api/topics)
  useEffect(()=>{
    fetch(API_URL)
      .then(res=>{
        if(!res.ok) throw new Error('조회 실패: '+res.status);
        return res.json();
      })
      .then(data=>setTopics(data))
      .catch(err=>{
        console.error(err);
        alert('서버에서 목록을 불러오지 못했어요. Spring Boot가 실행 중인지 확인하세요.');
      });
  }, []);

  // [수정 2026-10-08] 생성 (POST /api/topics)
  async function createTopic(_title, _body){
    try{
      const res = await fetch(API_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title:_title, body:_body})
      });
      if(!res.ok) throw new Error('생성 실패: '+res.status);
      const saved = await res.json();
      setTopics([...topics, saved]);
      setMode('READ');
      setId(saved.id);
    }catch(err){
      console.error(err);
      alert('글을 만들지 못했어요.');
    }
  }

  // [수정 2026-10-08] 수정 (PUT /api/topics/{id})
  async function updateTopic(_title, _body){
    try{
      const res = await fetch(API_URL+'/'+id, {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title:_title, body:_body})
      });
      if(!res.ok) throw new Error('수정 실패: '+res.status);
      const saved = await res.json();
      const newTopics = topics.map(t => t.id === saved.id ? saved : t);
      setTopics(newTopics);
      setMode('READ');
    }catch(err){
      console.error(err);
      alert('글을 수정하지 못했어요.');
    }
  }

  // [수정 2026-10-08] 삭제 (DELETE /api/topics/{id})
  async function deleteTopic(){
    try{
      const res = await fetch(API_URL+'/'+id, {method:'DELETE'});
      if(!res.ok) throw new Error('삭제 실패: '+res.status);
      setTopics(topics.filter(t => t.id !== id));
      setMode('WELCOME'); // 삭제 후 첫 화면으로
      setId(null);
    }catch(err){
      console.error(err);
      alert('글을 삭제하지 못했어요.');
    }
  }

  let content =null;
  let contextControl = null;

  if(mode === 'WELCOME'){
    content = <Article title='Welcome' body='Hello, WEB'></Article>

  }else if(mode ==='READ'){
     
    let title, body = null;
    for(let i=0; i<topics.length; i++){
       if(topics[i].id === id){
        title = topics[i].title;
        body = topics[i].body;
      }    
    }
    
    content = <Article title={title} body={body}></Article>
    contextControl = <><li><input type="button" value="Update" onClick={()=>{
      setMode('UPDATE');
    }}/></li>
    <li><input type="button" value="Delete" onClick={deleteTopic}/></li></>

  } else if(mode === 'CREATE'){
  
     content =<Create onCreate={createTopic}></Create>

  }else if(mode ==='UPDATE'){
     let title, body = null;
    for(let i=0; i<topics.length; i++){
       if(topics[i].id === id){
        title = topics[i].title;
        body = topics[i].body;
      }    
    }
    content =<Update title={title} body={body} onUpdate={updateTopic}></Update> 
 
 } return (
     <div>
      <Header title="WEB" onChangeMode={
        ()=>{
            setMode('WELCOME'); 
        }
      }></Header> 
      <Nav topics={topics} onChangeMode={
        (id)=>{
          setMode('READ'); 
          setId(id);
        }        
      }></Nav>
      {content}   
      <ul>
        {(mode === 'WELCOME' || mode === 'READ') && <li><input type="button" value="Create" onClick={()=>{
          setMode('CREATE');
        }}/></li>}
         {contextControl}
      </ul>
  </div>
  );
}

export default App;